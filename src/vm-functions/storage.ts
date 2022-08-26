import crypto from 'node:crypto';

import {jsonStringify} from '../json-stringify.js';
import {VMStorage} from '../vm-storage.js';
import {BetterMap} from '../utils/index.js';
import {getTabId} from '../tab.js';

/* See:
 *	https://violentmonkey.github.io/api/gm/
 *	https://github.com/DefinitelyTyped/DefinitelyTyped/blob/075a3b326659b486fc270491d0730979be29bc27/types/tampermonkey/index.d.ts
 */

/* For getValue, setValue and all related functions */
const storages = new VMStorage<BetterMap<string, string>>(
	() => new BetterMap(),
);

type SetValue = (key: string, value: any) => void;
/** Sets a key / value pair for current context to storage. */
const setValue: SetValue = (key, value) => {
	const oldValue = getRawValue(key);

	const stringified = jsonStringify(value);

	storages.get(true).set(key, stringified);

	dispatchChange(key, oldValue, stringified);
};

const getRawValue = (key: string) => storages.get(false)?.get(key);

type GetValue = <TValue>(key: string, defaultValue?: TValue) => TValue;
/** Retrieves a value for current context from storage. */
const getValue: GetValue = <TValue>(
	key: string,
	defaultValue?: TValue,
): TValue => {
	const rawValue = getRawValue(key);

	if (rawValue === undefined) {
		return defaultValue!;
	}

	return JSON.parse(rawValue) as TValue;
};

type DeleteValue = (key: string) => void;
/** Deletes an existing key / value pair for current context from storage. */
const deleteValue: DeleteValue = key => {
	const oldValue = getRawValue(key);

	storages.get(false)?.delete(key);

	dispatchChange(key, oldValue);
};

type ListValues = () => string[];
/** Returns an array of keys of all available values within this context. */
const listValues: ListValues = () => [...(storages.get(false)?.keys() ?? [])];

type AddValueChangeListenerCallback = (
	key: string,
	oldValue: any,
	newValue: any,
	remote: boolean,
) => void;

/**
 * ```
 * BetterMap<number, // id of the async context
 * 	BetterMap<string, // name of the value to listen for
 * 		BetterMap<string, // uuid of the callback
 * 		[tabId: number, callback: AddValueChangeListenerCallback]>
 * 	>
 * >
 * ```
 */
const valueChangeCallbacksStore = new VMStorage<
	BetterMap<
		string,
		BetterMap<string, [tabId: number, callback: AddValueChangeListenerCallback]>
	>
>(() => new BetterMap());

type AddValueChangeListener = (
	name: string,
	callback: AddValueChangeListenerCallback,
) => string;
/** Adds a change listener to the storage and returns the listener ID. */
const addValueChangeListener: AddValueChangeListener = (key, callback) => {
	const currentContextCallbacks = valueChangeCallbacksStore.get(true);

	const namedStorageCallbacks = currentContextCallbacks.get(
		key,
		() => new BetterMap(),
	);

	const listenerId = crypto.randomUUID();
	namedStorageCallbacks.set(listenerId, [getTabId(), callback]);

	return listenerId;
};

type RemoveValueChangeListener = (listenerId: string) => void;
/** Removes a change listener by its ID. */
const removeValueChangeListener: RemoveValueChangeListener = listenerId => {
	const currentContextCallbacks = valueChangeCallbacksStore.get(false);

	if (!currentContextCallbacks) {
		return;
	}

	for (const namedStorageCallbacks of currentContextCallbacks.values()) {
		namedStorageCallbacks.delete(listenerId);
	}
};

const parseValue = (value: string | undefined): any =>
	value === undefined ? value : JSON.parse(value);
const dispatchChange = (key: string, oldValue?: string, newValue?: string) => {
	if (oldValue === newValue) {
		return;
	}

	const currentContextCallbacks = valueChangeCallbacksStore.get(false);
	const namedStorageCallbacks = currentContextCallbacks?.get(key);

	if (!namedStorageCallbacks) {
		return;
	}

	const currentTabId = getTabId();
	for (const [callbackTabId, callback] of namedStorageCallbacks.values()) {
		callback(
			key,
			parseValue(oldValue),
			parseValue(newValue),
			currentTabId !== callbackTabId,
		);
	}
};

/**
 * Use these in ava test files
 */
export {
	setValue as GM_setValue,
	getValue as GM_getValue,
	deleteValue as GM_deleteValue,
	listValues as GM_listValues,
	addValueChangeListener as GM_addValueChangeListener,
	removeValueChangeListener as GM_removeValueChangeListener,
	type SetValue,
	type GetValue,
	type DeleteValue,
	type ListValues,
	type AddValueChangeListener,
	type AddValueChangeListenerCallback,
	type RemoveValueChangeListener,
};

/**
 * These are for in userscripts
 */
Object.defineProperties(global, {
	GM_setValue: {
		value: setValue,
	},
	GM_getValue: {
		value: getValue,
	},
	GM_deleteValue: {
		value: deleteValue,
	},
	GM_listValues: {
		value: listValues,
	},
	GM_addValueChangeListener: {
		value: addValueChangeListener,
	},
	GM_removeValueChangeListener: {
		value: removeValueChangeListener,
	},
});
