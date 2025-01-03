import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/xmlhttprequest.js';
import {createTestHttpServer} from '../_helpers/index.js';

test(
	'request methods',
	createTestHttpServer,
	async (t, {app, resolve: resolveUrl}) => {
		t.plan(19);

		app.all('/:method', (request, response) => {
			t.true((methods as readonly string[]).includes(request.method));
			t.is(request.method, request.params.method);

			const body =
				request.method === 'HEAD' || request.method === 'OPTIONS'
					? ''
					: 'Hello World';

			response.writeHead(200, {
				'Content-Type': 'text/plain',
				'Content-Length': Buffer.byteLength(body),
				...(request.method === 'OPTIONS' && {allow: 'OPTIONS, GET'}),
			});
			// HEAD | OPTIONS have no body
			if (request.method !== 'HEAD' && request.method !== 'OPTIONS') {
				response.write(body);
			}

			response.end();
		});

		// Test standard methods
		const methods = [
			'GET',
			'POST',
			'HEAD',
			'PUT',
			'DELETE',
			'OPTIONS',
		] as const;

		const start = async (method: (typeof methods)[number]) =>
			new Promise<void>(resolve => {
				// Reset each time
				const xhr = new XMLHttpRequest();

				xhr.addEventListener('load', () => {
					if (method === 'OPTIONS') {
						t.is(xhr.getResponseHeader('Allow'), 'OPTIONS, GET');
					}

					if (method === 'HEAD' || method === 'OPTIONS') {
						t.is(xhr.responseBuffer.byteLength, 0);
					} else {
						t.deepEqual(xhr.responseBuffer, Buffer.from('Hello World'));
					}

					resolve();
				});

				const url = resolveUrl(`/${method}`);
				xhr.open(method, url);
				xhr.send();
			});

		await Promise.all(methods.map(async method => start(method)));
	},
);
