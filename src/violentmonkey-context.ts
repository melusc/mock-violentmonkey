// https://nodejs.org/api/async_context.html
import {AsyncLocalStorage} from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<number>();

/* Abstract away AsyncLocalStorage#getStore to allow for error handling directly */

/**
 * Get the id of the current context
 * @returns The id
 */
export const getStore = () => {
	const store = asyncLocalStorage.getStore();

	if (store === undefined) {
		throw new Error(
			'Could not get context id. Did you call the test with violentMonkeyContext?',
		);
	}

	return store;
};

let idSeq = 0;

/**
 * Create a seperate context for seperated storages for each test
 *
 * @param cb The callback with the same parameters like a regular ava callback
 * @returns Returns the callback, mainly useful if the function is async
 */
export const violentMonkeyContext
	= <Args extends any[], ReturnV>(cb: (...args: Args) => ReturnV) =>
	(...args: Args) =>
		asyncLocalStorage.run(++idSeq, cb, ...args);
