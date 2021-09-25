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
		info: {
			get: GM_info,
		},
	},
);

Object.defineProperty(global, 'GM', {
	value: GM_,
});

type DeepAsyncFunctions<T extends Record<string, any>> = {
	[key in keyof T]: T[key] extends (...args: any[]) => void
		? (...args: Parameters<T[key]>) => Promise<ReturnType<T[key]>>
		: T[key];
};

export const GM = GM_ as Readonly<
	DeepAsyncFunctions<{
		setValue: SetValue;
		getValue: GetValue;
		listValues: ListValues;
		deleteValue: DeleteValue;
		info: ScriptInfo;
	}>
>;
