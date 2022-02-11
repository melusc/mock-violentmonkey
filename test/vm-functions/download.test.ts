import {Buffer} from 'node:buffer';
import test from 'ava';

import {
	GM_download,
	getDownloads,
	violentMonkeyContextMacro,
	getDownload,
} from '../../src/index.js';
import {setBaseUrl} from '../../src/base-url.js';

test(
	'GM_download with an existant url',
	violentMonkeyContextMacro(),
	async t => {
		setBaseUrl('https://httpbin.org/');

		await new Promise<void>(resolve => {
			GM_download({
				url: '/base64/R01fZG93bmxvYWQ=',
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
	},
);

test('GM_download with invalid url', violentMonkeyContextMacro(), async t => {
	await new Promise<void>((resolve, reject) => {
		GM_download({
			url: 'htt://google.com',
			name: 'name.txt',
			onload() {
				reject();
			},
			onerror() {
				resolve();
			},
		});
	});

	t.deepEqual(getDownloads(), {});
});
