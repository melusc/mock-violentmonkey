import {Buffer} from 'node:buffer';
import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/xmlhttprequest.js';

import {createServer} from '../_helpers';

test('redirect 303', async t => {
	t.plan(3);

	// Test server
	const {port, server} = await createServer((request, response) => {
		if (request.url === '/redirectingResource') {
			response.writeHead(303, {Location: `http://localhost:${port}/`});
			response.end();
			return;
		}

		const body = 'Hello World';
		response.writeHead(200, {
			'Content-Type': 'text/plain',
			'Content-Length': Buffer.byteLength(body),
			Date: 'Thu, 30 Aug 2012 18:17:53 GMT',
			Connection: 'close',
		});
		response.write('Hello World');
		response.end();

		server.close();
	});
	const xhr = new XMLHttpRequest();

	xhr.addEventListener('load', () => {
		t.is(xhr.getRequestHeader('Location'), '');
		t.is(xhr.responseBuffer.toString(), 'Hello World');
		t.is(xhr.responseURL, `http://localhost:${port}/`);
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);
		xhr.open('GET', `http://localhost:${port}/redirectingResource`);
		xhr.send();
	});
});
