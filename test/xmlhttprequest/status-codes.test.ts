import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

test('status-code 404', async t => {
	t.plan(3);

	const xhr = new XMLHttpRequest();
	xhr.addEventListener('load', () => {
		t.is(xhr.status, 404);
		t.is(xhr.statusText, 'Not Found');
		t.is(xhr.responseURL, 'https://httpbin.org/status/404');
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);
		xhr.open('get', 'https://httpbin.org/status/404');
		xhr.send();
	});
});

test('status-code 302', async t => {
	t.plan(3);

	const xhr = new XMLHttpRequest();
	xhr.addEventListener('load', () => {
		t.is(xhr.status, 500);
		t.is(xhr.statusText, 'Internal Server Error');
		t.is(xhr.responseURL, 'https://httpbin.org/status/500');
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', 'https://httpbin.org/status/500');
		xhr.send();
	});
});
