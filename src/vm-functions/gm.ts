import process from 'node:process';

import {
	DeleteValue,
	GetValue,
	GM_deleteValue,
	GM_getValue,
	GM_listValues,
	GM_setValue,
	ListValues,
	SetValue,
} from './storage';
import {GM_info, ScriptInfo} from './info';
import {GM_addStyle, AddStyle} from './add-style';
import {GM_notification, Notification} from './notification';

// GM.getResourceText doesn't exist
import {GM_getResourceURL, GetResourceURL} from './resource';

const makeFunctionAsync
	= <Args extends any[], ReturnV>(fn: (...args: Args) => ReturnV) =>
	async (...args: Args): Promise<ReturnV> => {
		await new Promise(resolve => {
			process.nextTick(resolve);
		});

		return fn(...args);
	};

const GM_ = Object.defineProperties(
	{},
	{
		setValue: {
			value: makeFunctionAsync(GM_setValue),
		},
		getValue: {
			value: makeFunctionAsync(GM_getValue),
		},
		listValues: {
			value: makeFunctionAsync(GM_listValues),
		},
		deleteValue: {
			value: makeFunctionAsync(GM_deleteValue),
		},
		addStyle: {
			value: GM_addStyle,
		},
		getResourceURL: {
			value: GM_getResourceURL,
		},
		notification: {
			value: GM_notification,
		},
		info: {
			get: GM_info,
		},
	},
);

Object.defineProperty(global, 'GM', {
	value: GM_,
});

type MakeFunctionAsync<T extends (...args: any[]) => void> = (
	...args: Parameters<T>
) => Promise<ReturnType<T>>;

export const GM = GM_ as Readonly<{
	setValue: MakeFunctionAsync<SetValue>;
	getValue: MakeFunctionAsync<GetValue>;
	listValues: MakeFunctionAsync<ListValues>;
	deleteValue: MakeFunctionAsync<DeleteValue>;
	addStyle: AddStyle;
	getResourceURL: MakeFunctionAsync<GetResourceURL>;
	notification: Notification;
	info: ScriptInfo;
}>;
