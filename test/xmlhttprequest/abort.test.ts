import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer, recordEventOrder} from '../_helpers/index.js';

test('Aborting after send', createTestHttpServer, async (t, {app, baseUrl}) => {
	t.plan(2);
	const xhr = new XMLHttpRequest();

	app.get('/', (request, response) => {
		response.status(200);
		response.write('Hello');

		request.on('close', () => {
			clearTimeout(timeout);
			response.end();
		});

		const timeout = setTimeout(() => {
			response.write(' World');
			response.end();
		}, 1000);
	});

	const readEvents = recordEventOrder(xhr);

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
			t.deepEqual(readEvents(), [
				'readystatechange-1',
				'loadstart-1',
				'readystatechange-2',
				'readystatechange-4',
				'abort-4',
				'loadend-4',
			]);

			resolve();
		});

		xhr.open('get', baseUrl);
		xhr.send();
	});
});
