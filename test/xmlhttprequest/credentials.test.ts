import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createServer} from '../_helpers/index.js';

test('credentials', async t => {
	const {port, server} = await createServer((request, response) => {
		t.is(
			request.headers.authorization,
			`Basic ${Buffer.from('user:password').toString('base64')}`,
		);

		response.writeHead(200, {
			'Content-Type': 'text/plain',
			'Content-Length': 0,
			Date: 'Thu, 30 Aug 2012 18:17:53 GMT',
			Connection: 'close',
		});
		response.end();
	});

	const xhr = new XMLHttpRequest();

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			server.close();
			resolve();
		});

		xhr.open('GET', `http://localhost:${port}/`, 'user', 'password');
		xhr.send();
	});
});
