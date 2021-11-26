import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';

test('options.base', async t => {
	t.plan(1);

	const xhr = new XMLHttpRequest({
		base: 'https://httpbin.org/',
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			t.is(xhr.responseURL, 'https://httpbin.org/json');
			resolve();
		});

		xhr.open('get', '/json');
		xhr.send();
	});
});
