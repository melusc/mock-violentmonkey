import process from 'node:process';

import test from 'ava';

import {
	GM,
	GM_getValue,
	GM_info,
	GM_setValue,
	GM_addStyle,
	violentMonkeyContext,
	GM_notification,
	GM_setClipboard,
} from '../../src';

const pNextTick = async () =>
	new Promise(resolve => {
		process.nextTick(resolve);
	});

test(
	'GM.setValue should set values asynchronously',
	violentMonkeyContext(async t => {
		GM_setValue('key', 0);

		void GM.setValue('key', 1);

		t.is(GM_getValue('key'), 0);

		await pNextTick();

		t.is(GM_getValue('key'), 1);
	}),
);

test(
	'GM.getValue should get values asynchronously',
	violentMonkeyContext(async t => {
		GM_setValue('key', 1);

		t.is(await GM.getValue('key'), 1);
	}),
);

test(
	'GM.deleteValue should delete asynchronously',
	violentMonkeyContext(async t => {
		GM_setValue('key', 10);

		void GM.deleteValue('key');

		t.is(GM_getValue('key'), 10);

		await pNextTick();

		t.is(GM_getValue('key'), undefined);
	}),
);

test(
	'GM.listValues should work asynchronously',
	violentMonkeyContext(async t => {
		GM_setValue('key1', 1);

		const keys = GM.listValues();

		GM_setValue('key2', 2);

		t.deepEqual((await keys).sort(), ['key1', 'key2'].sort());
	}),
);

test(
	'GM.addStyle should behave like GM_addStyle',
	violentMonkeyContext(t => {
		t.is(GM.addStyle, GM_addStyle);
		t.is(typeof GM.addStyle('').id, 'string');
	}),
);

test('GM.notification should behave like GM_notification', t => {
	t.is(GM.notification, GM_notification);
	t.is(typeof GM.notification, 'function');
});

test('GM.setClipboard should behave like GM_setClipboard', t => {
	t.is(GM.setClipboard, GM_setClipboard);
	t.is(typeof GM.setClipboard, 'function');
});

test(
	'GM.info should equal GM_info',
	violentMonkeyContext(t => {
		t.is(GM.info, GM_info());
	}),
);
