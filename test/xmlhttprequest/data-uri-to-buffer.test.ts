import {Buffer} from 'node:buffer';

import test from 'ava';

import {dataUriToBuffer} from '../../src/xmlhttprequest/data-uri-to-buffer.js';

test('valid base64 datauri to buffer', t => {
	t.plan(4);

	const buffer = dataUriToBuffer(
		'data:text/plain;charset=utf8;base64,SGVsbG8gdG8geW91LCBkZWFyIHJlYWRlci4=',
	);

	t.is(buffer.type, 'text/plain');
	t.is(buffer.typeFull, 'text/plain;charset=utf8');
	t.is(buffer.charset, 'utf8');

	t.deepEqual(
		buffer.slice(),
		Buffer.from('SGVsbG8gdG8geW91LCBkZWFyIHJlYWRlci4=', 'base64'),
	);
});

test('valid datauri with useless semicolon', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:text/plain;,f');

	t.is(buffer.type, 'text/plain');
	t.is(buffer.typeFull, 'text/plain');
	t.is(buffer.charset, '');

	t.deepEqual(buffer.slice(), Buffer.from('f'));
});

test('valid datauri with useless semicolon without type', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:;,g');

	t.is(buffer.type, 'text/plain');
	t.is(buffer.typeFull, 'text/plain;charset=US-ASCII');
	t.is(buffer.charset, 'US-ASCII');

	t.deepEqual(buffer.slice(), Buffer.from('g'));
});

test('valid url-encoded datauri to buffer', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:text/xml;charset=ascii,Hello%20there');

	t.is(buffer.type, 'text/xml');
	t.is(buffer.typeFull, 'text/xml;charset=ascii');
	t.is(buffer.charset, 'ascii');

	t.deepEqual(buffer.slice(), Buffer.from('Hello there'));
});

test('valid base64 datauri without type and charset to buffer', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:;base64,YQ==');

	t.is(buffer.type, 'text/plain');
	t.is(buffer.typeFull, 'text/plain;charset=US-ASCII');
	t.is(buffer.charset, 'US-ASCII');

	t.deepEqual(buffer.slice(), Buffer.from('a'));
});

test('valid datauri without type and charset to buffer', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:,b');

	t.is(buffer.type, 'text/plain');
	t.is(buffer.typeFull, 'text/plain;charset=US-ASCII');
	t.is(buffer.charset, 'US-ASCII');

	t.deepEqual(buffer.slice(), Buffer.from('b'));
});

test('valid datauri without type to buffer', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:;charset=utf8,c');

	t.is(buffer.type, 'text/plain');
	t.is(buffer.typeFull, 'text/plain;charset=utf8');
	t.is(buffer.charset, 'utf8');

	t.deepEqual(buffer.slice(), Buffer.from('c'));
});

test('valid datauri without type and with invalid charset to buffer', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:;charset0utf8,d');

	t.is(buffer.type, 'text/plain');
	t.is(buffer.typeFull, 'text/plain;charset0utf8;charset=US-ASCII');
	t.is(buffer.charset, 'US-ASCII');

	t.deepEqual(buffer.slice(), Buffer.from('d'));
});

test('valid datauri with type and invalid charset to buffer', t => {
	t.plan(4);

	const buffer = dataUriToBuffer('data:text/html;charset0utf8,e');

	t.is(buffer.type, 'text/html');
	t.is(buffer.typeFull, 'text/html;charset0utf8');
	t.is(buffer.charset, '');

	t.deepEqual(buffer.slice(), Buffer.from('e'));
});

test('invalid datauris to buffer', t => {
	t.plan(2);

	t.throws(() => {
		dataUriToBuffer('dat:text/plain,oops I misspelled the protocol');
	});

	t.throws(() => {
		dataUriToBuffer('data:');
	});
});
