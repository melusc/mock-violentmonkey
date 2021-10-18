// eslint-disable-next-line ava/use-test
import {ExecutionContext} from 'ava';

import {XMLHttpRequest, Events} from '../../src/xmlhttprequest';

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
			t.is(`${event}-${xhr.readyState}`, wantedOrder.shift());
		});
	}
};
