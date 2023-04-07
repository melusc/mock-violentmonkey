import {Blob as Blob_, Buffer} from 'node:buffer';

import test from 'ava';
import type {JsonObject} from 'type-fest';

import {setBaseUrl} from '../../src/base-url.js';
import {
	GM_xmlhttpRequest,
	enableDomGlobal,
	violentMonkeyContext,
	type Headers,
} from '../../src/index.js';
import {createServer} from '../_helpers/create-server.js';

enableDomGlobal('FormData');
enableDomGlobal('File');

declare const Blob: typeof Blob_;

test('globals', t => {
	t.is(Blob, Blob_);
});

test(
	'GM_xmlhttpRequest with instant abort',
	violentMonkeyContext(async t => {
		t.plan(3);

		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/delay/3',
				onabort(response) {
					t.deepEqual(response, {
						context: undefined,
						finalUrl: '',
						readyState: 4,
						responseHeaders: '',
						status: 0,
						statusText: '',
					} as any);

					t.is(response.response, '');
					t.is(response.responseText, '');
				},
				onloadend: resolve,
			}).abort();
		});
	}),
);

test(
	'GM_xmlhttpRequest with relative url',
	violentMonkeyContext(async t => {
		t.plan(1);

		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/html',
				onload({finalUrl}) {
					t.is(finalUrl, 'https://httpbin.org/html');
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'Cached GM_xmlhttpRequest response',
	violentMonkeyContext(async t => {
		t.plan(2);

		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/html',
				responseType: 'document',
				onload(responseObject) {
					// Make sure that it doesn't reparse it every single time
					t.is(responseObject.response, responseObject.response);

					// Make sure that it returned a document
					t.truthy((responseObject.response as Document).body);
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest document url',
	violentMonkeyContext(async t => {
		t.plan(1);

		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/html',
				responseType: 'document',
				onload(responseObject) {
					t.is(
						(responseObject.response as Document).URL,
						'https://httpbin.org/html',
					);
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest json response',
	violentMonkeyContext(async t => {
		t.plan(2);

		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/json',
				responseType: 'json',
				onload(responseObject) {
					t.is(
						Object.prototype.toString.call(responseObject.response),
						'[object Object]',
					);

					t.deepEqual(responseObject.response, {
						slideshow: {
							author: 'Yours Truly',
							date: 'date of publication',
							slides: [
								{
									title: 'Wake up to WonderWidgets!',
									type: 'all',
								},
								{
									items: [
										'Why <em>WonderWidgets</em> are great',
										'Who <em>buys</em> WonderWidgets',
									],
									title: 'Overview',
									type: 'all',
								},
							],
							title: 'Sample Slide Show',
						},
					});
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest document response',
	violentMonkeyContext(async t => {
		t.plan(3);
		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/html',
				onload(response) {
					const dom = response.response as Document;

					t.truthy(dom);
					t.truthy(dom.body);

					t.is(dom.querySelectorAll('body > *').length, 2);
				},
				responseType: 'document',
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest arraybuffer',
	violentMonkeyContext(async t => {
		t.plan(2);

		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/base64/YWJj',
				responseType: 'arraybuffer',
				onload(response) {
					const arrayBuffer = response.response as ArrayBuffer;
					t.true(arrayBuffer instanceof ArrayBuffer);

					t.deepEqual([...new Uint8Array(arrayBuffer)], [97, 98, 99]);
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest text response',
	violentMonkeyContext(async t => {
		t.plan(2);

		setBaseUrl('https://httpbin.org/');

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/base64/YWJj',
				responseType: 'text',
				onload(response) {
					t.is(typeof response.response, 'string');

					t.is(response.response, 'abc');
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest blob response',
	violentMonkeyContext(async t => {
		t.plan(2);

		setBaseUrl('https://httpbin.org/');

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: '/base64/eHl6',
				responseType: 'blob',
				async onload(response) {
					const blob = response.response as Blob_;

					t.true(blob instanceof Blob);

					t.is(await blob.text(), 'xyz');

					resolve();
				},
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest with global FormData',
	violentMonkeyContext(async t => {
		t.plan(3);

		setBaseUrl('https://httpbin.org/');

		const formData = new FormData();

		formData.append('string', 'value');

		const file = new File(
			['string', ', another string', Buffer.from(', a buffer')],
			'text.txt',
		);
		formData.append('file', file);

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/anything',
				data: formData,
				responseType: 'json',
				method: 'post',
				onload(responseObject) {
					const response = responseObject.response as Record<
						string,
						Record<string, string>
					>;

					t.deepEqual(response['files'], {
						file: 'string, another string, a buffer',
					});

					t.deepEqual(response['form'], {
						string: 'value',
					});

					// Non-null because otherwise typescript complains and this way ava will complain
					t.regex(
						response['headers']!['Content-Type']!,
						/^multipart\/form-data; boundary=-+[\da-f]+$/,
					);
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest with incorrect url',
	violentMonkeyContext(async t => {
		t.plan(1);

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: 'htt://google.com/',
				onerror() {
					t.pass();
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest with headers',
	violentMonkeyContext(async t => {
		t.plan(1);

		const headers: Headers = {
			'X-Abc': 'xyz',
			'User-Agent': 'node-xmlhttprequest',
		};

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: 'https://httpbin.org/headers',
				responseType: 'json',
				headers,
				onload({response}) {
					t.like((response as JsonObject)['headers'], headers);
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'Sending FormData',
	violentMonkeyContext(async t => {
		t.plan(5);
		const body = new FormData();

		body.append(
			'file-txt',
			new File(['abc'], 'file.txt', {
				type: 'text/plain',
			}),
		);

		body.append('file-octet', new File(['def'], 'file.blob'));

		body.append('string', 'ghi');

		const {port, server} = await createServer((request, response) => {
			response.writeHead(200);

			t.regex(
				request.headers['content-type']!,
				/^multipart\/form-data; boundary=-+[a-f\d]+$/,
			);
			const boundary = /boundary=(?<boundary>-+[a-f\d]+)$/.exec(
				request.headers['content-type']!,
			)!.groups!['boundary']!;

			const bodyParts: Buffer[] = [];

			request
				.on('data', b => {
					bodyParts.push(b as Buffer);
				})
				.on('close', () => {
					const body = Buffer.concat(bodyParts).toString('utf8');
					t.true(body.includes(boundary));
					t.regex(
						body,
						new RegExp(
							[
								'^content-disposition: form-data; name="file-txt"; filename="file.txt"$',
								'^content-type: text/plain$',
								'^$',
								'^abc$',
							].join('\\r\\n'),
							'im',
						),
					);
					t.regex(
						body,
						new RegExp(
							[
								'^content-disposition: form-data; name="file-octet"; filename="file.blob"$',
								'^content-type: application/octet-stream$',
								'^$',
								'^def$',
							].join('\\r\\n'),
							'im',
						),
					);
					t.regex(
						body,
						new RegExp(
							[
								'^content-disposition: form-data; name="string"$',
								'^$',
								'^ghi$',
							].join('\\r\\n'),
							'im',
						),
					);
					response.end();
				});
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: `http://localhost:${port}/`,
				method: 'post',
				data: body,
				onloadend() {
					server.close();
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending Blob with content-type',
	violentMonkeyContext(async t => {
		t.plan(2);
		const body = new Blob(['abc'], {
			type: 'text/plain',
		});

		const {port, server} = await createServer((request, response) => {
			response.writeHead(200);

			t.is(request.headers['content-type'], 'text/plain');

			const bodyParts: any[] = [];

			request
				.on('data', chunk => {
					bodyParts.push(chunk);
				})
				.on('end', () => {
					const body = Buffer.concat(bodyParts).toString('utf8');
					t.is(body, 'abc');
					response.end();
				});
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: `http://localhost:${port}/`,
				method: 'post',
				data: body,
				onloadend() {
					server.close();
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending Blob without content-type',
	violentMonkeyContext(async t => {
		t.plan(2);
		const body = new Blob(['qwerty']);

		const {port, server} = await createServer((request, response) => {
			response.writeHead(200);

			t.is(request.headers['content-type'], undefined);

			const bodyParts: any[] = [];

			request
				.on('data', chunk => {
					bodyParts.push(chunk);
				})
				.on('end', () => {
					const body = Buffer.concat(bodyParts).toString('utf8');
					t.is(body, 'qwerty');
					response.end();
				});
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: `http://localhost:${port}/`,
				method: 'post',
				data: body,
				onloadend() {
					server.close();
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending string',
	violentMonkeyContext(async t => {
		t.plan(2);

		const {port, server} = await createServer((request, response) => {
			response.writeHead(200);

			t.is(request.headers['content-type'], 'text/plain;charset=UTF-8');

			const bodyParts: any[] = [];

			request
				.on('data', chunk => {
					bodyParts.push(chunk);
				})
				.on('end', () => {
					const body = Buffer.concat(bodyParts).toString('utf8');
					t.is(body, 'Never gonna give you up');
					response.end();
				});
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: `http://localhost:${port}/`,
				method: 'post',
				data: 'Never gonna give you up',
				onloadend() {
					server.close();
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending no data',
	violentMonkeyContext(async t => {
		t.plan(2);

		const {port, server} = await createServer((request, response) => {
			response.writeHead(200);

			t.is(request.headers['content-type'], undefined);

			const bodyParts: any[] = [];

			request
				.on('data', chunk => {
					bodyParts.push(chunk);
				})
				.on('end', () => {
					const body = Buffer.concat(bodyParts).toString('utf8');
					t.is(body, '');
					response.end();
				});
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: `http://localhost:${port}/`,
				method: 'post',
				onloadend() {
					server.close();
					resolve();
				},
			});
		});
	}),
);

test(
	'Overriding content-type',
	violentMonkeyContext(async t => {
		t.plan(2);
		const body = new Blob(['{"key": "value"}'], {
			type: 'text/plain',
		});

		const {port, server} = await createServer((request, response) => {
			response.writeHead(200);

			t.is(request.headers['content-type'], 'application/json');

			const bodyParts: any[] = [];

			request
				.on('data', chunk => {
					bodyParts.push(chunk);
				})
				.on('end', () => {
					const body = Buffer.concat(bodyParts).toString('utf8');
					t.is(body, '{"key": "value"}');
					response.end();
				});
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: `http://localhost:${port}/`,
				method: 'post',
				data: body,
				headers: {
					'content-type': 'application/json',
				},
				onloadend() {
					server.close();
					resolve();
				},
			});
		});
	}),
);
