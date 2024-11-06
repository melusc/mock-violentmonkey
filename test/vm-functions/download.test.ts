import {Buffer} from 'node:buffer';

import test from 'ava';

import {setBaseUrl} from '../../src/base-url.js';
import {
	GM_download,
	getDownload,
	getDownloads,
	violentMonkeyContext,
	violentMonkeyContextMacro,
} from '../../src/index.js';
import {createTestHttpServer} from '../_helpers/create-server.js';

test(
	'GM_download with an existant url',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		setBaseUrl(baseUrl);

		await new Promise<void>(resolve => {
			GM_download({
				url: '/base64/R01fZG93bmxvYWQ',
				name: 'out.txt',
				onload(responseObject) {
					t.like(responseObject, {
						readyState: 4,
						status: 200,
						statusText: 'OK',
					});

					t.deepEqual(getDownload('out.txt'), Buffer.from('GM_download'));

					t.deepEqual(getDownloads(), {
						'out.txt': Buffer.from('GM_download'),
					});

					resolve();
				},
			});
		});
	}),
);

test('GM_download with invalid url', violentMonkeyContextMacro(), async t => {
	await new Promise<void>((resolve, reject) => {
		GM_download({
			url: 'htt://google.com',
			name: 'name.txt',
			onload() {
				reject(new Error('Called onload()'));
			},
			onerror() {
				resolve();
			},
		});
	});

	t.deepEqual(getDownloads(), {});
});

test(
	'GM_download event handlers',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		const called = new Set<string>();
		setBaseUrl(baseUrl);

		await new Promise<void>((resolve, reject) => {
			GM_download({
				url: '/uuid',
				name: 'out.txt',
				onabort() {
					reject(new Error('Called onabort()'));
				},
				onerror() {
					reject(new Error('Called onerror()'));
				},
				onload() {
					called.add('onload');
				},
				onloadend() {
					called.add('onloadend');
					resolve();
				},
				onloadstart() {
					called.add('onloadstart');
				},
				onprogress() {
					called.add('onprogress');
				},
				onreadystatechange() {
					called.add('onreadystatechange');
				},
				ontimeout() {
					reject(new Error('Called ontimeout()'));
				},
			});
		});

		t.deepEqual(
			[...called].sort(),
			[
				'onload',
				'onloadend',
				'onloadstart',
				'onprogress',
				'onreadystatechange',
			].sort(),
		);
	}),
);
