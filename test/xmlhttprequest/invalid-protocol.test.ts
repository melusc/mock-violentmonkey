import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

import {assertEventOrder, assertReadyStateValues} from '../_helpers';

test('misspelled data: protocol', async t => {
	t.plan(7);

	const xhr = new XMLHttpRequest();
	const url = 'dat:text/plain,oops I misspelled the protocol';

	assertEventOrder(t, xhr, [
		'readystatechange-1',
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
