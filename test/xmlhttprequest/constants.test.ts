import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';

test('constants', t => {
	const xhr = new XMLHttpRequest();

	t.is(xhr.UNSENT, 0);
	t.is(XMLHttpRequest.UNSENT, 0);
	t.is(xhr.OPENED, 1);
	t.is(XMLHttpRequest.OPENED, 1);
	t.is(xhr.HEADERS_RECEIVED, 2);
	t.is(XMLHttpRequest.HEADERS_RECEIVED, 2);
	t.is(xhr.LOADING, 3);
	t.is(XMLHttpRequest.LOADING, 3);
	t.is(xhr.DONE, 4);
	t.is(XMLHttpRequest.DONE, 4);
});
