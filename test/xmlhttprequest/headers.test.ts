import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/index.js';

test(
	'request and response headers',
	createTestHttpServer,
	async (t, {app, baseUrl}) => {
		t.plan(13);

		app.get('/', (request, response) => {
			// Test setRequestHeader
			t.is(request.headers['x-test'], 'Foobar');
			// Test non-conforming allowed header
			t.is(request.headers['user-agent'], 'node-XMLHttpRequest-test');
			// Test header set with blacklist disabled
			t.is(request.headers.referer, 'https://github.com');

			const body = 'Hello World';
			response.writeHead(200, {
				'Content-Type': 'text/plain',
				'Content-Length': Buffer.byteLength(body),
				// Set cookie headers to see if they're correctly passed
				// Actual values don't matter
				'Set-Cookie': 'foo=bar',
				'Set-Cookie2': 'bar=baz',
				Date: 'Sun, 17 Oct 2021 16:00:00 GMT',
				Connection: 'close',
			});
			response.write('Hello World');
			response.end();
		});

		const xhr = new XMLHttpRequest();

		xhr.addEventListener('load', () => {
			// Test getAllResponseHeaders()
			const headers = [
				'content-type: text/plain',
				'content-length: 11',
				'set-cookie: foo=bar',
				'set-cookie2: bar=baz',
				'date: Sun, 17 Oct 2021 16:00:00 GMT',
				'connection: close',
				'',
			].join('\r\n');

			t.is(xhr.getAllResponseHeaders(), headers);

			// Test case insensitivity
			t.is(xhr.getResponseHeader('Content-Type'), 'text/plain');
			t.is(xhr.getResponseHeader('Content-type'), 'text/plain');
			t.is(xhr.getResponseHeader('content-Type'), 'text/plain');
			t.is(xhr.getResponseHeader('content-type'), 'text/plain');

			// Test aborted getAllResponseHeaders
			xhr.abort();

			// ViolentMonkey still returns headers so we shall too!
			t.is(xhr.getAllResponseHeaders(), headers);
			t.is(xhr.getResponseHeader('Connection'), 'close');
		});

		t.is(xhr.getResponseHeader('Content-Type'), null);

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', resolve);

			xhr.open('GET', baseUrl);

			// Valid header
			xhr.setRequestHeader('X-Test', 'Foobar');

			// Allowed headers outside of specs
			xhr.setRequestHeader('user-agent', 'node-XMLHttpRequest-test');
			xhr.setRequestHeader('Referer', 'https://github.com');

			// Test getRequestHeader
			t.is(xhr.getRequestHeader('X-Test'), 'Foobar');

			// Test invalid header
			t.is(xhr.getRequestHeader('Content-Length'), '');

			xhr.send();
		});
	},
);
