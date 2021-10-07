// https://nodejs.org/api/async_context.html
import {AsyncLocalStorage} from 'node:async_hooks';

import {BetterMap} from './utils';

const asyncLocalStorage = new AsyncLocalStorage<number>();

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

let idSeq = 0;

/**
 * Create a seperate context for seperated storages for each test
 *
 * @param cb The callback with the same parameters like a regular ava callback
 * @returns Returns the callback, mainly useful if the function is async
 */
const violentMonkeyContext
	= <Args extends any[], ReturnV>(cb: (...args: Args) => ReturnV) =>
	(...args: Args) =>
		asyncLocalStorage.run(++idSeq, cb, ...args);

/** @internal */
export class VMStorage<V> {
	private readonly storages = new BetterMap<number, V>();

	constructor(private readonly getDefaultValue: () => V) {}

	get: {
		(setDefault: true): V;
		(setDefault: false): V | undefined;
	} = setDefault =>
		this.storages.get(
			getUserscriptId(),
			(setDefault ? this.getDefaultValue : undefined)!,
		);

	set = (value: V) => this.storages.set(getUserscriptId(), value);
}

export {violentMonkeyContext, getUserscriptId};
