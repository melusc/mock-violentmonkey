import test from 'ava';
import type {DOMWindow} from 'jsdom';

import {
	getWindow,
	loadStringToDom,
	loadURLToDom,
	violentMonkeyContext,
	enableDomGlobal,
} from '../src/index.js';
import {setBaseUrl} from '../src/base-url.js';

// Globals
declare const window: DOMWindow;
declare const document: Document;

test(
	'globals',
	violentMonkeyContext(t => {
		t.is(window, getWindow());
		t.is(typeof window, 'object');
		t.is(typeof document, 'object');
		t.is(document, getWindow().document);
		t.is(typeof document.createElement, 'function');
	}),
);

test(
	'enableDomGlobal',
	violentMonkeyContext(t => {
		t.is(typeof HTMLElement, 'undefined');
		enableDomGlobal('HTMLElement');
		t.true(document.createElement('a') instanceof HTMLElement);
	}),
);

test(
	'getWindow',
	violentMonkeyContext(t => {
		const {document, length} = getWindow();

		t.is(typeof getWindow(), 'object');
		t.is(typeof length, 'number');

		t.is(
			document.documentElement.outerHTML,
			'<html><head></head><body></body></html>',
		);
	}),
);

test(
	'loadStringToDom',
	violentMonkeyContext(t => {
		const {document} = getWindow();

		const html = `
<html>
	<head>
		<title>Title</title>
	</head>
	<body>
		<div>Hello!</div>

		<script src="">console.log('Script');</script>
	</body>
</html>`;

		loadStringToDom(html);

		t.is(
			getWindow().document.documentElement.outerHTML.replace(/\s+/g, ''),
			html.replace(/\s+/g, ''),
		);
		t.is(document.querySelectorAll('*').length, 6);

		// Clear dom
		loadStringToDom('');

		// <html>, <body>, <head>
		t.is(document.querySelectorAll('*').length, 3);
	}),
);

test(
	'loadURLToDom',
	violentMonkeyContext(async t => {
		await loadURLToDom('https://example.org');
		const {document} = getWindow();

		t.true(document.body.innerHTML.includes('Example Domain'));
		t.true(document.head.innerHTML.includes('Example Domain'));
		t.is(document.title, 'Example Domain');
		t.is(document.querySelectorAll('*').length, 13);
	}),
);

test(
	'Simple dom operations',
	violentMonkeyContext(t => {
		setBaseUrl('http://domain.localhost:4321');

		const {document, DocumentType, location} = getWindow();

		t.is(document.URL, 'http://domain.localhost:4321/');
		t.is(location.href, 'http://domain.localhost:4321/');

		document.body.append(document.createElement('a'));

		t.is(document.querySelectorAll('a').length, 1);

		const {doctype} = document;
		t.true(doctype instanceof DocumentType);
		// <!doctype html>
		t.is(doctype!.name, 'html');
		t.is(doctype!.systemId, '');
		t.is(doctype!.publicId, '');
	}),
);
