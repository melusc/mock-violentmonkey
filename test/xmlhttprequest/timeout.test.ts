import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {assertEventOrder, createTestHttpServer} from '../_helpers/index.js';

test(
	'timeout after 1s with initial body',
	createTestHttpServer,
	async (t, {app, baseUrl}) => {
		t.plan(10);

		app.get('/', (_request, response) => {
			response.writeHead(200, {
				'x-abc': 'xyz',
				'content-length': 33,
				'content-type': 'plain/text',
				date: 'Sun, 17 Oct 2021 14:00:00 GMT',
				connection: 'keep-alive',
			});

			response.write('Initial body');
			// Note: Not calling `response.end()`
		});

		const xhr = new XMLHttpRequest();
		assertEventOrder(t, xhr, [
			'readystatechange-1',
			'loadstart-1',
			'readystatechange-2',
			'readystatechange-3',
			'progress-3',
			'readystatechange-4',
			'timeout-4',
			'loadend-4',
		]);
		xhr.timeout = 1000;

		xhr.addEventListener('timeout', () => {
			t.is(xhr.status, 200);

			const expectedHeaders = [
				'x-abc: xyz',
				'content-length: 33',
				'content-type: plain/text',
				'date: Sun, 17 Oct 2021 14:00:00 GMT',
				'connection: keep-alive',
				'',
			].join('\r\n');
			t.is(xhr.getAllResponseHeaders(), expectedHeaders);
		});

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', resolve);

			xhr.open('get', baseUrl);
			xhr.send();
		});
	},
);

test(
	'timeout after 1s without initial body',
	createTestHttpServer,
	async (t, {app, baseUrl}) => {
		t.plan(7);

		app.get('/', (_request, response) => {
			response.writeHead(200, {
				'x-abc': 'xyz',
				'content-length': 33,
				'content-type': 'plain/text',
				date: 'Sun, 17 Oct 2021 14:00:00 GMT',
				connection: 'keep-alive',
			});

			// Note: Not calling `response.end()`
		});

		const xhr = new XMLHttpRequest();
		assertEventOrder(t, xhr, [
			'readystatechange-1',
			'loadstart-1',
			'readystatechange-4',
			'timeout-4',
			'loadend-4',
		]);
		xhr.timeout = 1000;

		xhr.addEventListener('timeout', () => {
			t.is(xhr.status, 0);

			t.is(xhr.getAllResponseHeaders(), '');
		});

		await new Promise<void>(resolve => {
			xhr.addEventListener('loadend', resolve);

			xhr.open('get', baseUrl);
			xhr.send();
		});
	},
);
