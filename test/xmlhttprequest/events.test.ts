import {Buffer} from 'node:buffer';

import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';

import {createServer} from '../_helpers/index.js';

test('events', async t => {
	t.plan(3);

	// Test server
	const {port, server} = await createServer((_request, response) => {
		const body = 'Hello World';

		response.writeHead(200, {
			'Content-Type': 'text/plain',
			'Content-Length': Buffer.byteLength(body),
		});

		response.end('Hello World');
	});

	const xhr = new XMLHttpRequest();

	// Track event calls
	let onreadystatechange = false;
	let readystatechange = false;
	let removedEventCalled = false;
	const removedEvent = () => {
		removedEventCalled = true;
	};

	// eslint-disable-next-line unicorn/prefer-add-event-listener
	xhr.onreadystatechange = () => {
		onreadystatechange = true;
	};

	xhr.addEventListener('readystatechange', () => {
		readystatechange = true;
	});

	xhr.addEventListener('readystatechange', removedEvent);
	xhr.removeEventListener('readystatechange', removedEvent);

	await new Promise<void>(resolve => {
		xhr.addEventListener('loadend', () => {
			t.true(onreadystatechange);
			t.true(readystatechange);
			t.false(removedEventCalled);

			server.close();
			resolve();
		});

		xhr.open('GET', `http://localhost:${port}/`);
		xhr.send();
	});
});
