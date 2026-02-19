import type {Events, XMLHttpRequest} from '../../src/xmlhttprequest/index.js';

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

export function recordEventOrder(xhr: XMLHttpRequest): () => string[] {
	const result: string[] = [];

	for (const event of events) {
		xhr.addEventListener(event, () => {
			// Let ava, not typescript complain about undefined
			result.push(`${event}-${xhr.readyState}`);
		});
	}

	return () => {
		return result;
	};
}

export function compareEventsOneOf(
	actual: string[],
	expectedOneOf: string[][],
) {
	for (const expected of expectedOneOf) {
		if (expected.length !== actual.length) {
			continue;
		}

		let allEqual = true;
		// eslint-disable-next-line unicorn/no-for-loop
		for (let index = 0; index < actual.length; ++index) {
			if (actual[index] !== expected[index]) {
				allEqual = false;
				break;
			}
		}

		if (allEqual) {
			return true;
		}
	}

	return false;
}
