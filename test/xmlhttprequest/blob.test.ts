import {Blob, Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

import {assertEventOrder, assertReadyStateValues} from '../_helpers';

test('valid object url', async t => {
	t.plan(12);

	const blob = new Blob(['abc'], {type: 'text/plain'});
	const url = URL.createObjectURL(blob);

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

	assertReadyStateValues(t, xhr, {
		1: {
			headers: '',
			status: 0,
			statusText: '',
			responseBuffer: Buffer.alloc(0),
			responseURL: '',
		},
		2: {
			headers: 'content-type: text/plain\r\ncontent-length: 3\r\n',
			status: 200,
			statusText: 'OK',
			responseBuffer: Buffer.alloc(0),
			responseURL: url,
		},
		3: {
			headers: 'content-type: text/plain\r\ncontent-length: 3\r\n',
			status: 200,
			statusText: 'OK',
			responseBuffer: Buffer.from('abc'),
			responseURL: url,
		},
		4: {
			headers: 'content-type: text/plain\r\ncontent-length: 3\r\n',
			status: 200,
			statusText: 'OK',
			responseBuffer: Buffer.from('abc'),
			responseURL: url,
		},
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', url);
		xhr.send();
	});
});

test('invalid object url', async t => {
	t.plan(7);

	const xhr = new XMLHttpRequest();

	assertEventOrder(t, xhr, [
		'readystatechange-1',
		'loadstart-1',
		'readystatechange-4',
		'error-4',
		'loadend-4',
	]);

	assertReadyStateValues(t, xhr, {
		1: {
			headers: '',
			status: 0,
			statusText: '',
			responseBuffer: Buffer.alloc(0),
			responseURL: '',
		},
		4: {
			headers: '',
			status: 0,
			statusText: '',
			responseBuffer: Buffer.alloc(0),
			responseURL: '',
		},
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', 'blob:nodedata:definitely-not-a-uuid');
		xhr.send();
	});
});

test('valid object url, but method not GET', async t => {
	t.plan(7);

	const blob = new Blob(['abc'], {type: 'text/plain'});
	const url = URL.createObjectURL(blob);

	const xhr = new XMLHttpRequest();

	assertEventOrder(t, xhr, [
		'readystatechange-1',
		'loadstart-1',
		'readystatechange-4',
		'error-4',
		'loadend-4',
	]);

	assertReadyStateValues(t, xhr, {
		1: {
			headers: '',
			status: 0,
			statusText: '',
			responseBuffer: Buffer.alloc(0),
			responseURL: '',
		},
		4: {
			headers: '',
			status: 0,
			statusText: '',
			responseBuffer: Buffer.alloc(0),
			responseURL: url,
		},
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('post', url);
		xhr.send();
	});
});
