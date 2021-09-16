import {jsonStringify} from '../json-stringify';
import {getStore} from '../violentmonkey-context';

/* See:
 *	https://violentmonkey.github.io/api/gm/
 *	https://github.com/DefinitelyTyped/DefinitelyTyped/blob/075a3b326659b486fc270491d0730979be29bc27/types/tampermonkey/index.d.ts
 */

/* For getValue, setValue and all related functions */
const storages = new Map<number, Map<string, string>>();

const getStorage = () => {
	const id = getStore();
	let map = storages.get(id);

	if (!map) {
		map = new Map();
		storages.set(id, map);
	}

	return map;
};

type SetValue = (key: string, value: any) => void;
const setValue: SetValue = (key, value) => {
	const stringified = jsonStringify(value);

	getStorage().set(key, stringified);
};

type GetValue = <TValue>(key: string, defaultValue?: TValue) => TValue;
const getValue: GetValue = <TValue>(
	key: string,
	defaultValue?: TValue,
): TValue => {
	const unparsed = getStorage().get(key);
	if (unparsed === undefined) {
		return defaultValue!;
	}

	return JSON.parse(unparsed) as TValue;
};

type DeleteValue = (key: string) => void;
const deleteValue: DeleteValue = key => {
	getStorage().delete(key);
};

type ListValues = () => string[];
const listValues: ListValues = () => [...getStorage().keys()];

/**
 * Use these in ava test files
 */
export {
	setValue as GM_setValue,
	getValue as GM_getValue,
	deleteValue as GM_deleteValue,
	listValues as GM_listValues,
	SetValue,
	GetValue,
	DeleteValue,
	ListValues,
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
});
