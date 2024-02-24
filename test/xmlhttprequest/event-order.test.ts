import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/create-server.js';

test(
	'it should fire .on-listeners, then addEventListeners the order added',
	createTestHttpServer,
	async (t, {resolve: resolveUrl}) => {
		let counter = 0;
		const callback = (orderExpected: number) => () => {
			t.is(counter++, orderExpected);
		};

		const xhr = new XMLHttpRequest();

		xhr.onloadend = callback(0);
		xhr.addEventListener('loadend', callback(1));
		xhr.addEventListener('loadend', callback(2));
		xhr.addEventListener('loadend', callback(3));

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', () => {
				t.is(counter, 4);
				resolve();
			});

			xhr.open('get', resolveUrl('/uuid'));
			xhr.send();
		});
	},
);
