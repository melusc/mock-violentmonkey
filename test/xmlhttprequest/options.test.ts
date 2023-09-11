import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/create-server.js';

test(
	'options.base',
	createTestHttpServer,
	async (t, {baseUrl, resolve: resolveUrl}) => {
		t.plan(1);

		const xhr = new XMLHttpRequest({
			base: baseUrl,
		});

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', () => {
				t.is(xhr.responseURL, resolveUrl('/json'));
				resolve();
			});

			xhr.open('get', '/json');
			xhr.send();
		});
	},
);
