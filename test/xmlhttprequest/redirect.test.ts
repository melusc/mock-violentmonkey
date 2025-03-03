import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/xmlhttprequest.js';
import {createTestHttpServer} from '../_helpers/index.js';

for (const statusCode of [301, 302, 303, 307, 308]) {
	test(
		`redirect ${statusCode} relative url`,
		createTestHttpServer,
		async (t, {app, resolve: resolveUrl}) => {
			t.plan(3);

			app.get('/redirect', (_request, response) => {
				response.redirect(statusCode, '/final');
			});
			app.get('/final', (_request, response) => {
				response.status(200).send(`Redirect ${statusCode} lead here`);
			});

			const xhr = new XMLHttpRequest();

			xhr.addEventListener('load', () => {
				t.is(xhr.getRequestHeader('Location'), '');
				t.is(xhr.responseBuffer.toString(), `Redirect ${statusCode} lead here`);
				t.is(xhr.responseURL, resolveUrl('/final'));
			});

			await new Promise<void>(resolve => {
				xhr.addEventListener('loadend', resolve);

				xhr.open('GET', resolveUrl('/redirect'));
				xhr.send();
			});
		},
	);

	test(
		`redirect ${statusCode} absolute url`,
		createTestHttpServer,
		async (t, {app, resolve: resolveUrl}) => {
			t.plan(3);

			app.get('/redirect', (_request, response) => {
				response.redirect(statusCode, 'https://example.com/');
			});

			const xhr = new XMLHttpRequest();

			xhr.addEventListener('load', () => {
				t.is(xhr.getRequestHeader('Location'), '');
				t.regex(xhr.responseBuffer.toString(), /Example Domain/);
				t.is(xhr.responseURL, 'https://example.com/');
			});

			await new Promise<void>(resolve => {
				xhr.addEventListener('loadend', resolve);

				xhr.open('GET', resolveUrl('/redirect'));
				xhr.send();
			});
		},
	);

	test(
		`redirect ${statusCode} multiple urls`,
		createTestHttpServer,
		async (t, {app, resolve: resolveUrl}) => {
			t.plan(3);

			app.get('/redirect1', (_request, response) => {
				response.redirect(statusCode, '/redirect2');
			});
			app.get('/redirect2', (_request, response) => {
				response.redirect(statusCode, '/redirect3');
			});
			app.get('/redirect3', (_request, response) => {
				response.redirect(statusCode, '/final');
			});
			app.get('/final', (_request, response) => {
				response.status(200).send(`Redirect ${statusCode} lead here`);
			});

			const xhr = new XMLHttpRequest();

			xhr.addEventListener('load', () => {
				t.is(xhr.getRequestHeader('Location'), '');
				t.is(xhr.responseBuffer.toString(), `Redirect ${statusCode} lead here`);
				t.is(xhr.responseURL, resolveUrl('/final'));
			});

			await new Promise<void>(resolve => {
				xhr.addEventListener('loadend', resolve);

				xhr.open('GET', resolveUrl('/redirect1'));
				xhr.send();
			});
		},
	);
}
