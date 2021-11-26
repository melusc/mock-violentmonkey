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
} from './storage.js';
import {GM_info, ScriptInfo} from './info.js';
import {GM_addStyle, AddStyle} from './add-style.js';
import {GM_notification, Notification} from './notification.js';
import {GM_setClipboard, SetClipboard} from './clipboard.js';
import {GM_openInTab, OpenInTab} from './open-in-tab.js';
import {GM_xmlhttpRequest, XmlHttpRequest} from './xmlhttprequest.js';
import {GM_getResourceURL, GetResourceURL} from './resource.js';

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
	openInTab: OpenInTab;
	xmlHttpRequest: XmlHttpRequest;
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
	openInTab: {
		value: GM_openInTab,
	},
	xmlHttpRequest: {
		value: GM_xmlhttpRequest,
	},
	info: {
		get: GM_info,
	},
});

export {GM, GM_type};

Object.defineProperty(global, 'GM', {
	value: GM,
});
