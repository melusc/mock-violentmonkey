import {AsyncLocalStorage} from 'node:async_hooks';
import process from 'node:process';

import test from 'ava';

import {
	getUserscriptId,
	violentMonkeyContext,
} from '../src/violentmonkey-context.js';

test(
	'violentMonkeyContext should create a context with an id',
	violentMonkeyContext(t => {
		t.is(typeof getUserscriptId(), 'symbol');
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
		// eslint-disable-next-line unicorn/prefer-await
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
		const asyncLocalStorage = new AsyncLocalStorage();
		asyncLocalStorage.run(NaN, () => {
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
