import test from 'ava';

import {getStore, violentMonkeyContext} from '../src/violentmonkey-context';

test(
	'violentMonkeyContext should create a context with an id',
	violentMonkeyContext(t => {
		t.is(typeof getStore(), 'number');
		t.true(Number.isFinite(getStore()));
	}),
);

test(
	'violentMonkeyContext should work with async environments',
	violentMonkeyContext(async t => {
		const id = getStore();
		t.plan(3);

		// Sync
		t.is(typeof id, 'number');

		await Promise.resolve().then(() => {
			// In callback
			t.is(getStore(), id);
		});

		// Async
		t.is(getStore(), id);
	}),
);

test('getStore should throw when not run in violentMonkeyContext', t => {
	t.throws(
		() => {
			getStore();
		},
		{
			message: /violentmonkeycontext/i,
		},
	);
});
