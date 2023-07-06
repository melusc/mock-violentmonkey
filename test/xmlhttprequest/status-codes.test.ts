import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/create-server.js';

test(
	'status code 404',
	createTestHttpServer,
	async (t, {resolve: resolveUrl}) => {
		t.plan(3);

		const xhr = new XMLHttpRequest();
		xhr.addEventListener('load', () => {
			t.is(xhr.status, 404);
			t.is(xhr.statusText, 'Not Found');
			t.is(xhr.responseURL, resolveUrl('/status/404'));
		});

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', resolve);
			xhr.open('get', resolveUrl('/status/404'));
			xhr.send();
		});
	},
);

test(
	'status code 500',
	createTestHttpServer,
	async (t, {resolve: resolveUrl}) => {
		t.plan(3);

		const xhr = new XMLHttpRequest();
		xhr.addEventListener('load', () => {
			t.is(xhr.status, 500);
			t.is(xhr.statusText, 'Internal Server Error');
			t.is(xhr.responseURL, resolveUrl('/status/500'));
		});

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', resolve);

			xhr.open('get', resolveUrl('/status/500'));
			xhr.send();
		});
	},
);
