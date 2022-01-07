import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {assertEventOrder, createServer} from '../_helpers/index.js';

test('timeout after 1s', async t => {
	t.plan(10);

	const {port, server} = await createServer((_request, response) => {
		const timeout = setTimeout(() => {
			response.end('[french accent] 5s seconds later');
		}, 3000);

		response.writeHead(200, {
			'x-abc': 'xyz',
			'content-length': 33,
			'content-type': 'plain/text',
			date: 'Sun, 17 Oct 2021 14:00:00 GMT',
			connection: 'keep-alive',
		});

		response.write('a');

		server.on('close', () => {
			clearTimeout(timeout);
		});
	});

	const xhr = new XMLHttpRequest();
	assertEventOrder(t, xhr, [
		'readystatechange-1',
		'loadstart-1',
		'readystatechange-2',
		'readystatechange-3',
		'progress-3',
		'readystatechange-4',
		'timeout-4',
		'loadend-4',
	]);
	xhr.timeout = 1000;

	xhr.addEventListener('timeout', () => {
		t.is(xhr.status, 200);

		const expectedHeaders
			= 'x-abc: xyz\r\n'
			+ 'content-length: 33\r\n'
			+ 'content-type: plain/text\r\n'
			+ 'date: Sun, 17 Oct 2021 14:00:00 GMT\r\n'
			+ 'connection: keep-alive\r\n';
		t.is(xhr.getAllResponseHeaders(), expectedHeaders);
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			server.close();
			resolve();
		});

		xhr.open('get', `http://localhost:${port}`);
		xhr.send();
	});
});
