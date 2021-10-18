import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

test('TRACK should throw', t => {
	t.plan(1);

	const xhr = new XMLHttpRequest();

	t.throws(
		() => {
			// @ts-expect-error  Typescript knows it's invalid but we're testing if the code knows as well
			xhr.open('TRACK', 'http://localhost:8000');
		},
		{
			message: /"track"/i,
		},
	);
});

test('TRACE should throw', t => {
	t.plan(1);

	const xhr = new XMLHttpRequest();

	t.throws(
		() => {
			// @ts-expect-error  See comment in TRACK
			xhr.open('TRACE', 'http://localhost:8000');
		},
		{
			message: /"trace"/i,
		},
	);
});

test('CONNECT should throw', t => {
	t.plan(1);

	const xhr = new XMLHttpRequest();

	t.throws(
		() => {
			// @ts-expect-error  See comment in TRACK
			xhr.open('CONNECT', 'http://localhost:8000');
		},
		{
			message: /"connect"/i,
		},
	);
});

test('GET should not throw ', t => {
	t.plan(1);

	const xhr = new XMLHttpRequest();

	t.notThrows(() => {
		xhr.open('GET', 'http://localhost:8000');
	});
});

test('Setting forbidden headers should return false', t => {
	t.plan(17);

	const xhr = new XMLHttpRequest();

	t.throws(
		() => {
			xhr.setRequestHeader('x-any', 'header');
		},
		{
			message: /open/i,
		},
	);

	xhr.open('GET', 'https://localhost:8000');

	// Test forbidden headers
	const forbiddenRequestHeaders = [
		'accept-charset',
		'accept-encoding',
		'access-control-request-headers',
		'access-control-request-method',
		'connection',
		'content-length',
		'content-transfer-encoding',
		'date',
		'expect',
		'keep-alive',
		'te',
		'trailer',
		'transfer-encoding',
		'upgrade',
		'via',
	];

	for (const forbiddenHeader of forbiddenRequestHeaders) {
		t.false(
			xhr.setRequestHeader(forbiddenHeader, 'Test'),
			`ERROR: ${forbiddenHeader} should have returned false`,
		);
	}

	t.true(xhr.setRequestHeader('x-foobar', 'test'));
});
