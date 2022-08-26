import type {ExecutionContext} from 'ava';

import type {XMLHttpRequest, Events} from '../../src/xmlhttprequest/index.js';

const events: readonly Events[] = [
	'abort',
	'error',
	'load',
	'loadend',
	'loadstart',
	'progress',
	'readystatechange',
	'timeout',
];

export const assertEventOrder = (
	t: ExecutionContext<any>,
	xhr: XMLHttpRequest,
	wantedOrder: Array<`${Events}-${number}`>,
) => {
	wantedOrder = [...wantedOrder];

	for (const event of events) {
		xhr.addEventListener(event, () => {
			// Let ava, not typescript complain about undefined
			t.is(`${event}-${xhr.readyState}`, wantedOrder.shift()!);
		});
	}
};
