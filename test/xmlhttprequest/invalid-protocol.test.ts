import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {assertReadyStateValues, recordEventOrder} from '../_helpers/index.js';

test('misspelled data: protocol', async t => {
	t.plan(4);

	const xhr = new XMLHttpRequest();
	const url = 'dat:text/plain,oops I misspelled the protocol';

	const readEvents = recordEventOrder(xhr);

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
		xhr.addEventListener('loadend', () => {
			t.deepEqual(readEvents(), [
				'readystatechange-1',
				'readystatechange-4',
				'error-4',
				'loadend-4',
			]);

			resolve();
		});

		t.notThrows(() => {
			xhr.open('get', url);
			xhr.send();
		});
	});
});
