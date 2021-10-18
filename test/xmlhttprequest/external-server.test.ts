import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

import {assertEventOrder} from '../_helpers';

test('Should work just as well with external servers', async t => {
	const xhr = new XMLHttpRequest();

	assertEventOrder(t, xhr, [
		'readystatechange-1',
		'loadstart-1',
		'readystatechange-2',
		'readystatechange-3',
		'progress-3',
		'readystatechange-4',
		'load-4',
		'loadend-4',
	]);

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			t.regex(xhr.responseBuffer.toString(), /<title>Example Domain<\/title>/);
			resolve();
		});

		xhr.open('GET', 'https://example.com/');
		xhr.send();
	});
});
