import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';

test('It should fire 10 progress events', async t => {
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

		xhr.open('get', 'https://httpbin.org/drip?duration=1&numbytes=10&code=200');
		xhr.send();
	});
});
