// https://nodejs.org/api/async_context.html
import {AsyncLocalStorage} from 'node:async_hooks';

import type {EmptyObject} from 'type-fest';

/* Ideally using empty arrays allows for garbage collection
	in combination with (Better-)WeakMap
 */
const asyncLocalStorage = new AsyncLocalStorage<EmptyObject>();

/* Abstract away AsyncLocalStorage#getStore to allow for error handling directly */

/**
 * Get the id of the current context
 * @internal
 * @returns The id
 */
const getUserscriptId = () => {
	const store = asyncLocalStorage.getStore();

	if (store === undefined) {
		throw new Error(
			'Could not get context id. Did you call the test with violentMonkeyContext?',
		);
	}

	return store;
};

/**
 * Create a seperate context for seperated storages for each test
 *
 * @param cb The callback with the same parameters like a regular ava callback
 * @returns Returns the callback, mainly useful if the function is async
 */
const violentMonkeyContext
	= <Arguments extends any[], ReturnV>(
		callback: (...arguments_: Arguments) => ReturnV,
	) =>
	(...arguments_: Arguments) =>
		asyncLocalStorage.run({}, callback, ...arguments_);

export {violentMonkeyContext, getUserscriptId};
