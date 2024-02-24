import process from 'node:process';

import {GM_addStyle, type AddStyle} from './add-style.js';
import {GM_setClipboard, type SetClipboard} from './clipboard.js';
import {GM_info, type ScriptInfo} from './info.js';
import {GM_notification, type Notification} from './notification.js';
import {GM_openInTab, type OpenInTab} from './open-in-tab.js';
import {GM_getResourceURL, type GetResourceURL} from './resource.js';
import {
	GM_deleteValue,
	GM_getValue,
	GM_listValues,
	GM_setValue,
	type DeleteValue,
	type GetValue,
	type ListValues,
	type SetValue,
} from './storage.js';
import {GM_xmlhttpRequest, type XmlHttpRequest} from './xmlhttprequest.js';

type MakeFunctionAsync<T extends (...arguments_: any[]) => void> = (
	...arguments_: Parameters<T>
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
	= <Arguments extends any[], ReturnV>(
		function_: (...arguments_: Arguments) => ReturnV,
	) =>
	async (...arguments_: Arguments): Promise<ReturnV> => {
		await new Promise(resolve => {
			process.nextTick(resolve);
		});

		return function_(...arguments_);
	};

const GM = Object.defineProperties<GM_type>({} as GM_type, {
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

export {GM, type GM_type};

Object.defineProperty(global, 'GM', {
	value: GM,
});
