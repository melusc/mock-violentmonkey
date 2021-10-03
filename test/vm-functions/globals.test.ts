import test from 'ava';

import {
	violentMonkeyContext,
	SetValue,
	GetValue,
	DeleteValue,
	ListValues,
	ScriptInfo,
	AddStyle,
	GM_setValue as GM_setValue_imported,
	GM_getValue as GM_getValue_imported,
	GM_deleteValue as GM_deleteValue_imported,
	GM_listValues as GM_listValues_imported,
	GM_info as GM_info_imported,
	GM_addStyle as GM_addStyle_imported,
} from '../../src';

declare const GM_setValue: SetValue;
declare const GM_getValue: GetValue;
declare const GM_deleteValue: DeleteValue;
declare const GM_listValues: ListValues;
declare const GM_addStyle: AddStyle;

declare const GM_info: ScriptInfo;

test(
	'GM_setValue should exist as a global function',
	violentMonkeyContext(t => {
		t.is(GM_setValue, GM_setValue_imported);

		GM_setValue('key', 'a');
		t.is(GM_getValue_imported('key'), 'a');
	}),
);

test(
	'GM_getValue should exist as a global function',
	violentMonkeyContext(t => {
		t.is(GM_getValue, GM_getValue_imported);

		GM_setValue_imported('key', 'b');
		t.is(GM_getValue('key'), 'b');
	}),
);

test(
	'GM_deleteValue should exist as a global function',
	violentMonkeyContext(t => {
		t.is(GM_deleteValue, GM_deleteValue_imported);

		GM_setValue_imported('key', 'c');
		t.is(GM_getValue('key'), 'c');

		GM_deleteValue('key');

		t.is(GM_getValue('key', 'd'), 'd');
	}),
);

test(
	'GM_listValues should exist as a global function',
	violentMonkeyContext(t => {
		t.is(GM_listValues, GM_listValues_imported);

		t.deepEqual(GM_listValues(), []);

		GM_setValue_imported('key0', '');
		GM_setValue_imported('key1', '');
		GM_setValue_imported('key3', '');

		t.deepEqual(GM_listValues(), ['key0', 'key1', 'key3']);
	}),
);

test(
	'GM_addStyle should exist as a global function',
	violentMonkeyContext(t => {
		t.is(GM_addStyle, GM_addStyle_imported);
		t.is(typeof GM_addStyle, 'function');
	}),
);

test(
	'GM_info should exist as a global getter',
	violentMonkeyContext(t => {
		t.is(GM_info, GM_info_imported());

		GM_info.scriptMetaStr = 'very meta';

		t.is(GM_info.scriptMetaStr, GM_info_imported().scriptMetaStr);

		t.throws(() => {
			// Should do nothing / throw
			Object.defineProperty(global, 'GM_info', {
				value: '',
			});
		});

		t.is(GM_info, GM_info_imported());
	}),
);
