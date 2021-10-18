import crypto from 'node:crypto';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

test('image', async t => {
	t.plan(1);

	const xhr = new XMLHttpRequest();

	xhr.addEventListener('load', () => {
		t.is(
			crypto.createHash('sha256').update(xhr.responseBuffer).digest('hex'),
			'541a1ef5373be3dc49fc542fd9a65177b664aec01c8d8608f99e6ec95577d8c1',
		);
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', 'https://httpbin.org/image/png');
		xhr.send();
	});
});
