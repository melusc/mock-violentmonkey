import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer, recordEventOrder} from '../_helpers/index.js';

test(
	'drip duration=1 numbytes=10',
	createTestHttpServer,
	async (t, {resolve: resolveUrl}) => {
		t.plan(21);

		const xhr = new XMLHttpRequest();

		const amountBytes = 10;

		const readEvents = recordEventOrder(xhr);
		let counter = 1;

		xhr.addEventListener('readystatechange', () => {
			if (xhr.readyState === xhr.LOADING) {
				t.is(xhr.responseBuffer.toString(), '*'.repeat(counter));
			}
		});

		xhr.addEventListener('progress', () => {
			t.is(xhr.responseBuffer.toString(), '*'.repeat(counter));

			++counter;
		});

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', () => {
				t.deepEqual(readEvents(), [
					'readystatechange-1',
					'loadstart-1',
					'readystatechange-2',
					...Array.from(
						{length: amountBytes},
						() => ['readystatechange-3', 'progress-3'] as const,
					).flat(),
					'readystatechange-4',
					'load-4',
					'loadend-4',
				]);

				resolve();
			});

			xhr.open('get', resolveUrl(`/drip?duration=1&numbytes=${amountBytes}`));
			xhr.send();
		});
	},
);
