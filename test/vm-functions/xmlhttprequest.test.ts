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
import {
	createTestHttpServer,
	requestBodyToBuffer,
} from '../_helpers/create-server.js';

enableDomGlobal('FormData');
enableDomGlobal('File');

declare const Blob: typeof Blob_;

test('globals', t => {
	t.is(Blob, Blob_);
});

test(
	'GM_xmlhttpRequest with instant abort',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(3);

		setBaseUrl(baseUrl);

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
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl, resolve: resolveUrl}) => {
		t.plan(1);

		setBaseUrl(baseUrl);

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/html',
				onload({finalUrl}) {
					t.is(finalUrl, resolveUrl('/html'));
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'Cached GM_xmlhttpRequest response',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(2);

		setBaseUrl(baseUrl);

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
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl, resolve: resolveUrl}) => {
		t.plan(1);

		setBaseUrl(baseUrl);

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/html',
				responseType: 'document',
				onload(responseObject) {
					t.is((responseObject.response as Document).URL, resolveUrl('/html'));
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest json response',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(2);

		setBaseUrl(baseUrl);

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
						string: 'string',
						number: 42,
						boolean: true,
						array: [1, 2, 3],
						object: {
							key: 'value',
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
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(3);
		setBaseUrl(baseUrl);

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
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(2);

		setBaseUrl(baseUrl);

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
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(2);

		setBaseUrl(baseUrl);

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
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(2);

		setBaseUrl(baseUrl);

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

function makeFormDataRegex(...lines: string[]): RegExp {
	return new RegExp(lines.map(s => `^${s}$`).join('\\r\\n'), 'm');
}

test(
	'GM_xmlhttpRequest with global FormData',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(1);

		setBaseUrl(baseUrl);

		const formData = new FormData();

		formData.append('string', 'value');

		const file = new File(
			['string', ', another string', Buffer.from(', a buffer')],
			'text.txt',
		);
		formData.append('file', file);

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/echo',
				data: formData,
				responseType: 'text',
				method: 'post',
				onload(response) {
					const stringifiedFormData = response.response as string;

					t.regex(
						stringifiedFormData,
						makeFormDataRegex(
							'-+[^-]+',
							'Content-Disposition: form-data; name="string"',
							'',
							'value',
							'-+[^-]+',
							'Content-Disposition: form-data; name="file"; filename="text.txt"',
							'Content-Type: application/octet-stream',
							'',
							'string, another string, a buffer',
							'-+[^-]+--',
						),
					);
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'GM_xmlhttpRequest with invalid url',
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
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl}) => {
		t.plan(1);

		setBaseUrl(baseUrl);

		const headers: Headers = {
			'x-abc': 'xyz',
			'user-agent': 'node-xmlhttprequest',
		};

		await new Promise(resolve => {
			GM_xmlhttpRequest({
				url: '/headers',
				responseType: 'json',
				headers,
				onload({response}) {
					t.like(response as JsonObject, headers);
				},
				onloadend: resolve,
			});
		});
	}),
);

test(
	'Sending FormData',
	createTestHttpServer,
	violentMonkeyContext(async (t, {app, baseUrl}) => {
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

		app.post('/', async (request, response) => {
			response.status(200);

			t.regex(
				request.headers['content-type']!,
				/^multipart\/form-data; boundary=-+[a-f\d]+$/,
			);
			const boundary = /boundary=(?<boundary>-+[a-f\d]+)$/.exec(
				request.headers['content-type']!,
			)!.groups!['boundary']!;

			const bodyBuffer = await requestBodyToBuffer(request);
			const body = bodyBuffer.toString('utf8');
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

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: baseUrl,
				method: 'post',
				data: body,
				onloadend() {
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending Blob with content-type',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl, app}) => {
		t.plan(2);
		const body = new Blob(['abc'], {
			type: 'text/plain',
		});

		app.post('/', async (request, response) => {
			response.status(200);

			const requestBody = await requestBodyToBuffer(request);

			t.is(request.headers['content-type'], 'text/plain');

			const body = requestBody.toString('utf8');
			t.is(body, 'abc');
			response.end();
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: baseUrl,
				method: 'post',
				data: body,
				responseType: 'text',
				onloadend() {
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending Blob without content-type',
	createTestHttpServer,
	violentMonkeyContext(async (t, {baseUrl, app}) => {
		t.plan(2);
		const body = new Blob(['qwerty']);

		app.post('/', async (request, response) => {
			response.status(200);

			t.is(request.headers['content-type'], undefined);

			const bodyBuffer = await requestBodyToBuffer(request);
			const body = bodyBuffer.toString('utf8');
			t.is(body, 'qwerty');
			response.end();
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: baseUrl,
				method: 'post',
				data: body,
				onloadend() {
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending string',
	createTestHttpServer,
	violentMonkeyContext(async (t, {app, baseUrl}) => {
		t.plan(2);

		app.post('/', async (request, response) => {
			response.status(200);

			t.is(request.headers['content-type'], 'text/plain;charset=UTF-8');

			const bodyBuffer = await requestBodyToBuffer(request);
			const body = bodyBuffer.toString('utf8');

			t.is(body, 'Never gonna give you up');
			response.end();
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: baseUrl,
				method: 'post',
				data: 'Never gonna give you up',
				onloadend() {
					resolve();
				},
			});
		});
	}),
);

test(
	'Sending no data',
	createTestHttpServer,
	violentMonkeyContext(async (t, {app, baseUrl}) => {
		t.plan(2);

		app.post('/', async (request, response) => {
			response.status(200);

			t.is(request.headers['content-type'], undefined);

			const bodyBuffer = await requestBodyToBuffer(request);
			const body = bodyBuffer.toString('utf8');
			t.is(body, '');
			response.end();
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: baseUrl,
				method: 'post',
				onloadend() {
					resolve();
				},
			});
		});
	}),
);

test(
	'Overriding content-type',
	createTestHttpServer,
	violentMonkeyContext(async (t, {app, baseUrl}) => {
		t.plan(2);
		const body = new Blob(['{"key": "value"}'], {
			type: 'text/plain',
		});

		app.post('/', async (request, response) => {
			response.status(200);

			t.is(request.headers['content-type'], 'application/json');

			const bodyBuffer = await requestBodyToBuffer(request);
			const body = bodyBuffer.toString('utf8');

			t.is(body, '{"key": "value"}');
			response.end();
		});

		await new Promise<void>(resolve => {
			GM_xmlhttpRequest({
				url: baseUrl,
				method: 'post',
				data: body,
				headers: {
					'content-type': 'application/json',
				},
				onloadend() {
					resolve();
				},
			});
		});
	}),
);
