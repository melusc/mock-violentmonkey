import test from 'ava';

import {
	violentMonkeyContext,
	GM_deleteValue,
	GM_getValue,
	GM_listValues,
	GM_setValue,
} from '../../src';

test(
	'GM_getValue should be connected to GM_setValue',
	violentMonkeyContext(t => {
		const secretMessage = `hello there! ${Math.random()}`;

		GM_setValue('secretMsg', secretMessage);
		t.is(GM_getValue('secretMsg'), secretMessage);
	}),
);

test(
	'GM_getValue should return the second param if value does not exist',
	violentMonkeyContext(t => {
		const symbol = Symbol('');

		t.is(GM_getValue('THIS_DOESNT_EXIST', symbol), symbol);
	}),
);

test(
	'GM_setValue should not save the actual object in memory',
	violentMonkeyContext(t => {
		const object = {
			deeply: {
				nested: {
					with: {an: {array: ['', 0, true]}},
				},
			},
		};

		GM_setValue('object', object);

		const result = GM_getValue('object');

		t.not(result, object);
		t.deepEqual(result, object);
	}),
);

test(
	'GM_deleteValue should properly delete a value',
	violentMonkeyContext(t => {
		GM_setValue('a', 'a');
		GM_setValue('b', 'b');

		t.is(GM_getValue('a'), 'a');
		t.is(GM_getValue('b'), 'b');

		GM_deleteValue('a');

		t.is(GM_getValue('a'), undefined);
		t.is(GM_getValue('b'), 'b');
	}),
);

test(
	'GM_listValues should list all keys',
	violentMonkeyContext(t => {
		t.deepEqual(GM_listValues(), []);

		GM_setValue('a', 1);
		GM_setValue('b', 2);
		GM_setValue('d', 4);

		t.deepEqual(GM_listValues().sort(), ['a', 'b', 'd'].sort());
	}),
);

test('GM_* without violentMonkeyContext should throw.', t => {
	t.throws(() => {
		GM_getValue('hello', 'world');
	});

	t.throws(() => {
		GM_setValue('a', 'b');
	});

	t.throws(() => {
		GM_deleteValue('key');
	});

	t.throws(() => {
		GM_listValues();
	});
});
