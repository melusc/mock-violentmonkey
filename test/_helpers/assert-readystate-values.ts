import type {Buffer} from 'node:buffer';

import type {ExecutionContext} from 'ava';

import type {XMLHttpRequest} from '../../src/xmlhttprequest/index.js';

type ExpectedValues = {
	headers: string;
	status: number;
	statusText: string;
	responseBuffer: Buffer;
	responseURL: string;
};

/**
 * This is only to assert that the values are correct.
 * Use assertEventOrder to make sure that every event goes off.
 */
export const assertReadyStateValues = (
	t: ExecutionContext,
	xhr: XMLHttpRequest,
	expectedValues: Partial<Record<1 | 2 | 3 | 4, ExpectedValues>>,
) => {
	xhr.addEventListener('readystatechange', () => {
		if (xhr.readyState === 0) {
			t.fail('Unexpected readystatechange event on readyState 0');
			return;
		}

		t.deepEqual(
			{
				headers: xhr.getAllResponseHeaders(),
				status: xhr.status,
				statusText: xhr.statusText,

				responseBuffer: xhr.responseBuffer,
				responseURL: xhr.responseURL,
			},
			// If it is undefined anyway ava will complain
			// If readyState 2 never gets ava will never complain (but typescript doesn't know that)
			expectedValues[xhr.readyState]!,
		);
	});
};
