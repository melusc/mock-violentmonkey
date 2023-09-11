import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/index.js';

test('credentials', createTestHttpServer, async (t, {resolve: resolveUrl}) => {
	const xhr = new XMLHttpRequest();

	await new Promise<void>(resolve => {
		xhr.addEventListener('load', () => {
			const json = JSON.parse(xhr.responseBuffer.toString('utf8')) as Record<
				string,
				string
			>;
			t.like(json, {
				authorization: `Basic ${Buffer.from('user:password').toString(
					'base64',
				)}`,
			});
		});

		xhr.addEventListener('loadend', resolve);

		xhr.open('GET', resolveUrl('/headers'), 'user', 'password');
		xhr.send();
	});
});
