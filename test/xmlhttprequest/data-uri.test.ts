import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {assertEventOrder, assertReadyStateValues} from '../_helpers/index.js';

test('xhr valid base64 datauri', async t => {
	t.plan(13);

	const xhr = new XMLHttpRequest();

	const url =
		'data:text/plain;charset=utf8;base64,SGVsbG8gdG8geW91LCBkZWFyIHJlYWRlci4=';

	assertEventOrder(t, xhr, [
		'readystatechange-1',
		'loadstart-1',
		'readystatechange-2',
		'readystatechange-3',
		'progress-3',
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
			headers:
				'content-type: text/plain;charset=utf8\r\ncontent-length: 26\r\n',
			status: 200,
			statusText: 'OK',
			responseBuffer: Buffer.alloc(0),
			responseURL: url,
		},
		3: {
			headers:
				'content-type: text/plain;charset=utf8\r\ncontent-length: 26\r\n',
			status: 200,
			statusText: 'OK',
			responseBuffer: Buffer.from(
				'SGVsbG8gdG8geW91LCBkZWFyIHJlYWRlci4',
				'base64',
			),
			responseURL: url,
		},
		4: {
			headers:
				'content-type: text/plain;charset=utf8\r\ncontent-length: 26\r\n',
			status: 200,
			statusText: 'OK',
			responseBuffer: Buffer.from(
				'SGVsbG8gdG8geW91LCBkZWFyIHJlYWRlci4',
				'base64',
			),
			responseURL: url,
		},
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', url);
		xhr.send();
	});
});

test('xhr valid url-encoded datauri', async t => {
	t.plan(1);

	const url = 'data:text/xml;charset=ascii,Hello%20there';

	const xhr = new XMLHttpRequest();

	xhr.addEventListener('load', () => {
		t.deepEqual(
			{
				headers: xhr.getAllResponseHeaders(),
				status: xhr.status,
				statusText: xhr.statusText,
				responseBuffer: xhr.responseBuffer,
				responseURL: xhr.responseURL,
			},
			{
				headers:
					'content-type: text/xml;charset=ascii\r\ncontent-length: 11\r\n',
				status: 200,
				statusText: 'OK',
				responseBuffer: Buffer.from('Hello there'),
				responseURL: url,
			},
		);
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', url);
		xhr.send();
	});
});

test('xhr valid base64 datauri without type and charset', async t => {
	t.plan(1);

	const url = 'data:;base64,YQ==';

	const xhr = new XMLHttpRequest();
	xhr.addEventListener('load', () => {
		t.deepEqual(
			{
				headers: xhr.getAllResponseHeaders(),
				status: xhr.status,
				statusText: xhr.statusText,
				responseBuffer: xhr.responseBuffer,
				responseURL: xhr.responseURL,
			},
			{
				headers:
					'content-type: text/plain;charset=US-ASCII\r\ncontent-length: 1\r\n',
				status: 200,
				statusText: 'OK',
				responseBuffer: Buffer.from('a'),
				responseURL: url,
			},
		);
	});
	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('GET', url);
		xhr.send();
	});
});

test('xhr valid datauri without type and charset to buffer', async t => {
	t.plan(1);

	const url = 'data:,b';

	const xhr = new XMLHttpRequest();
	xhr.addEventListener('load', () => {
		t.deepEqual(
			{
				headers: xhr.getAllResponseHeaders(),
				status: xhr.status,
				statusText: xhr.statusText,
				responseBuffer: xhr.responseBuffer,
				responseURL: xhr.responseURL,
			},
			{
				headers:
					'content-type: text/plain;charset=US-ASCII\r\ncontent-length: 1\r\n',
				status: 200,
				statusText: 'OK',
				responseBuffer: Buffer.from('b'),
				responseURL: url,
			},
		);
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', url);
		xhr.send();
	});
});

test('datauri with misspelled protocol', t => {
	t.plan(2);

	const url = 'dat:text/plain,oops I misspelled the protocol';
	const xhr = new XMLHttpRequest();

	t.notThrows(() => {
		xhr.open('get', url);
	});

	t.is(xhr.readyState, xhr.OPENED);
});

test('xhr invalid datauri', async t => {
	t.plan(8);

	const xhr = new XMLHttpRequest();

	const url = 'data:';

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

		t.notThrows(() => {
			xhr.open('get', url);
			xhr.send();
		});
	});
});
