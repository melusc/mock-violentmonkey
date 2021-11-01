import process from 'node:process';

import {AsyncLocalStorage} from 'node:async_hooks';
import test from 'ava';

import {
	getUserscriptId,
	violentMonkeyContext,
} from '../src/violentmonkey-context';

test(
	'violentMonkeyContext should create a context with an id',
	violentMonkeyContext(t => {
		t.deepEqual(getUserscriptId(), []);
	}),
);

test(
	'violentMonkeyContext should work with async environments',
	violentMonkeyContext(async t => {
		const id = getUserscriptId();
		t.plan(5);

		// Sync
		t.is(getUserscriptId(), id);

		// In callback
		await Promise.resolve().then(() => {
			t.is(getUserscriptId(), id);
		});

		// Async
		t.is(getUserscriptId(), id);

		// Very nested
		await new Promise<void>(resolve => {
			setImmediate(() => {
				process.nextTick(() => {
					setTimeout(() => {
						t.is(getUserscriptId(), id);
						resolve();
					}, 10);
				});
			});
		});

		// Different AsyncLocalStorage
		new AsyncLocalStorage().run(Number.NaN, () => {
			t.is(getUserscriptId(), id);
		});
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

	t.notThrows(
		violentMonkeyContext(() => {
			getUserscriptId();
		}),
	);
});
