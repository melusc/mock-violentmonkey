import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';
import {createTestHttpServer} from '../_helpers/index.js';

test('events', createTestHttpServer, async (t, {resolve: resolveUrl}) => {
	t.plan(3);

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

			resolve();
		});

		xhr.open('GET', resolveUrl('/uuid'));
		xhr.send();
	});
});
