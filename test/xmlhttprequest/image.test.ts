import crypto from 'node:crypto';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/create-server.js';

test('image', createTestHttpServer, async (t, {resolve: resolveUrl}) => {
	t.plan(1);

	const xhr = new XMLHttpRequest();

	xhr.addEventListener('load', () => {
		t.is(
			crypto.createHash('sha256').update(xhr.responseBuffer).digest('hex'),
			'3b852b7faaed217e958c20ddc84e9218e5efb2e31af73970327fffe17cfe7c91',
		);
	});

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', resolve);

		xhr.open('get', resolveUrl('/image'));
		xhr.send();
	});
});
