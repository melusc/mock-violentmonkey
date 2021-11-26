import test from 'ava';

import {VMStorage} from '../src/vm-storage.js';
import {violentMonkeyContext} from '../src/index.js';

test(
	'VMStorage',
	violentMonkeyContext(t => {
		const storage = new VMStorage(() => 'default');

		t.is(storage.get(false), undefined);
		t.is(storage.get(true), 'default');

		storage.set('not default');
		t.is(storage.get(false), 'not default');
		t.is(storage.get(true), 'not default');

		t.is(storage.set('aaa'), storage);
	}),
);
