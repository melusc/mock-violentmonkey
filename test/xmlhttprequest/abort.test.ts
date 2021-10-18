import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

import {createServer, assertEventOrder} from '../_helpers';

test('Aborting after send', async t => {
	t.plan(7);
	const xhr = new XMLHttpRequest();

	const {port, server} = await createServer((request, response) => {
		response.writeHead(200);
		response.write('Hello');

		request.on('close', () => {
			clearTimeout(timeout);
			response.end();
		});

		const timeout = setTimeout(() => {
			response.write(' World');
			response.end();
		}, 1000);

		server.on('close', () => {
			clearTimeout(timeout);
			response.end();
		});
	});

	assertEventOrder(t, xhr, [
		'readystatechange-1',
		'loadstart-1',
		'readystatechange-2',
		'readystatechange-4',
		'abort-4',
		'loadend-4',
	]);

	xhr.addEventListener('readystatechange', () => {
		if (xhr.readyState === xhr.HEADERS_RECEIVED) {
			xhr.abort();
		}
	});

	xhr.addEventListener('abort', () => {
		t.deepEqual(xhr.responseBuffer, Buffer.alloc(0));
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			server.close();
			resolve();
		});

		xhr.open('get', `http://localhost:${port}/`);
		xhr.send();
	});
});
