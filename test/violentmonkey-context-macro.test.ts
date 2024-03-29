import anyTest, {type TestFn} from 'ava';

import {
	GM_getValue,
	GM_setValue,
	violentMonkeyContextMacro,
} from '../src/index.js';

const test = anyTest as TestFn<{foo: string}>;

test.beforeEach(t => {
	t.context = {
		foo: 'aa',
	};
});

test(
	'violentMonkeyContextMacro with context',
	violentMonkeyContextMacro(),
	t => {
		t.deepEqual(t.context, {foo: 'aa'});
	},
);

test('GM_setValue with ava macro', violentMonkeyContextMacro(), t => {
	t.plan(2);

	t.notThrows(() => {
		GM_setValue('a', 'b');
	});

	t.is(GM_getValue<string>('a'), 'b');
});
