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
import {GM_setClipboard, SetClipboard} from './clipboard';

// GM.getResourceText doesn't exist
import {GM_getResourceURL, GetResourceURL} from './resource';

type MakeFunctionAsync<T extends (...args: any[]) => void> = (
	...args: Parameters<T>
) => Promise<ReturnType<T>>;

type GM_type = Readonly<{
	setValue: MakeFunctionAsync<SetValue>;
	getValue: MakeFunctionAsync<GetValue>;
	listValues: MakeFunctionAsync<ListValues>;
	deleteValue: MakeFunctionAsync<DeleteValue>;
	addStyle: AddStyle;
	getResourceURL: MakeFunctionAsync<GetResourceURL>;
	notification: Notification;
	setClipboard: SetClipboard;
	info: ScriptInfo;
}>;

const makeFunctionAsync
	= <Args extends any[], ReturnV>(fn: (...args: Args) => ReturnV) =>
	async (...args: Args): Promise<ReturnV> => {
		await new Promise(resolve => {
			process.nextTick(resolve);
		});

		return fn(...args);
	};

const GM = Object.defineProperties<GM_type>({} as any, {
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
	setClipboard: {
		value: GM_setClipboard,
	},
	info: {
		get: GM_info,
	},
});

export {GM, GM_type};

Object.defineProperty(global, 'GM', {
	value: GM,
});
