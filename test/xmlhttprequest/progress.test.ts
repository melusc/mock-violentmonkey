import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/create-server.js';

test(
	'It should fire 10 progress events',
	createTestHttpServer,
	async (t, {resolve: resolveUrl}) => {
		t.plan(11);

		const xhr = new XMLHttpRequest();

		let progressCount = 0;
		xhr.addEventListener('progress', () => {
			++progressCount;
			t.deepEqual(xhr.responseBuffer, Buffer.from('*'.repeat(progressCount)));
		});

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', () => {
				t.deepEqual(xhr.responseBuffer, Buffer.from('*'.repeat(10)));
				resolve();
			});

			xhr.open('get', resolveUrl('/drip?duration=1&numbytes=10'));
			xhr.send();
		});
	},
);
