import test from 'ava';

import {
	violentMonkeyContext,
	/*****/
	GM_deleteValue,
	GM_getValue,
	GM_listValues,
	GM_setValue,
	GM_addValueChangeListener,
	GM_removeValueChangeListener,
	/*****/
	tabContext,
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

test(
	'GM_addValueChangeListener without remote',
	violentMonkeyContext(async t => {
		GM_setValue('key', 20);

		const promise = new Promise<void>(resolve => {
			GM_addValueChangeListener(
				'key',
				(key, oldValue: number, newValue: number, remote) => {
					t.is(key, 'key');
					t.is(oldValue, 20);
					t.is(newValue, 30);
					t.false(remote);

					resolve();
				},
			);
		});

		GM_setValue('key', 30);

		return promise;
	}),
);

test(
	'GM_addValueChangeListener with tabContext',
	violentMonkeyContext(async t => {
		GM_setValue('key', 10);

		const remotePromise = new Promise<void>(resolve => {
			GM_addValueChangeListener('key', (_, _1, _2, remote) => {
				t.true(remote);

				resolve();
			});
		});

		await tabContext(async () => {
			const nonRemotePromise = new Promise<void>(resolve => {
				GM_addValueChangeListener('key', (_, _1, _2, remote) => {
					t.false(remote);

					resolve();
				});
			});

			GM_setValue('key', 11);

			return nonRemotePromise;
		});

		return remotePromise;
	}),
);

test(
	'GM_removeValueChangeListener',
	violentMonkeyContext(t => {
		let amountCalledCb1 = 0;
		const valueListenerId = GM_addValueChangeListener('key', () => {
			++amountCalledCb1;
		});
		let amountCalledCb2 = 0;
		GM_addValueChangeListener('key', () => {
			++amountCalledCb2;
		});

		GM_setValue('key', 0);
		GM_setValue('key', 2);

		GM_removeValueChangeListener(valueListenerId);

		GM_setValue('key', 3);

		t.is(amountCalledCb1, 2);
		t.is(amountCalledCb2, 3);
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

	t.throws(() => {
		GM_addValueChangeListener('', () => {
			// Nothing
		});
	});

	t.throws(() => {
		GM_removeValueChangeListener('c0ffeec0-coffee-c0ff-eec0-ffeec0ffeec0');
	});
});
