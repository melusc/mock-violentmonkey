import test from 'ava';

import {
	getUserscriptId,
	violentMonkeyContext,
} from '../src/violentmonkey-context';

test(
	'violentMonkeyContext should create a context with an id',
	violentMonkeyContext(t => {
		t.true(Number.isFinite(getUserscriptId()));
	}),
);

test(
	'violentMonkeyContext should work with async environments',
	violentMonkeyContext(async t => {
		const id = getUserscriptId()!;
		t.plan(3);

		// Sync
		t.is(getUserscriptId(), id);

		await Promise.resolve().then(() => {
			// In callback
			t.is(getUserscriptId(), id);
		});

		// Async
		t.is(getUserscriptId(), id);
	}),
);

test('getUserscriptId should throw when not run in violentMonkeyContext', t => {
	t.throws(
		() => {
			getUserscriptId();
		},
		{
			message: /violentmonkeycontext/i,
		},
	);
});
