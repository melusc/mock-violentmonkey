import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {compareEventsOneOf, recordEventOrder} from '../_helpers/index.js';

test('Should work just as well with external servers', async t => {
	const xhr = new XMLHttpRequest();

	const readEvents = recordEventOrder(xhr);

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			t.regex(xhr.responseBuffer.toString(), /<title>Example Domain<\/title>/);

			t.assert(
				compareEventsOneOf(readEvents(), [
					[
						'readystatechange-1',
						'loadstart-1',
						'readystatechange-2',
						'readystatechange-3',
						'progress-3',
						'readystatechange-4',
						'load-4',
						'loadend-4',
					],
					[
						'readystatechange-1',
						'loadstart-1',
						'readystatechange-2',
						'readystatechange-3',
						'progress-3',
						'readystatechange-3',
						'progress-3',
						'readystatechange-4',
						'load-4',
						'loadend-4',
					],
				]),
			);

			resolve();
		});

		xhr.open('GET', 'https://example.com/');
		xhr.send();
	});
});
