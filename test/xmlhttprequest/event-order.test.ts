import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';

test('it should fire .on-listeners, then addEventListeners the order added', async t => {
	let counter = 0;
	const cb = (orderExpected: number) => () => {
		t.is(counter++, orderExpected);
	};

	const xhr = new XMLHttpRequest();

	xhr.onloadend = cb(0);
	xhr.addEventListener('loadend', cb(1));
	xhr.addEventListener('loadend', cb(2));
	xhr.addEventListener('loadend', cb(3));

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			t.is(counter, 4);
			resolve();
		});

		xhr.open('get', 'https://httpbin.org/uuid');
		xhr.send();
	});
});
