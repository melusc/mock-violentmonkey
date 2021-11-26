import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {assertEventOrder} from '../_helpers/index.js';

test('httpbin/drip, duration=1, numbytes=10', async t => {
	t.plan(46);

	const xhr = new XMLHttpRequest();

	const amountBytes = 10;

	assertEventOrder(t, xhr, [
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
		xhr.addEventListener('loadend', resolve);

		xhr.open(
			'get',
			`https://httpbin.org/drip?duration=1&numbytes=${amountBytes}&code=200`,
		);
		xhr.send();
	});
});
