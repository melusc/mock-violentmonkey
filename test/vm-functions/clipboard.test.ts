import test from 'ava';

import {GM_setClipboard, getClipboard, violentMonkeyContext} from '../../src';

test(
	'GM_setClipboard normal behaviour',
	violentMonkeyContext(t => {
		GM_setClipboard('1', 'text/plain');

		t.deepEqual(getClipboard(), {
			data: '1',
			type: 'text/plain',
		});

		GM_setClipboard('2');

		t.deepEqual(getClipboard(), {
			data: '2',
			type: 'text/plain',
		});

		GM_setClipboard('<div>3</div>', 'text/html');

		t.deepEqual(getClipboard(), {
			data: '<div>3</div>',
			type: 'text/html',
		});
	}),
);

test(
	'Never calling GM_setClipboard',
	violentMonkeyContext(t => {
		t.is(getClipboard(), undefined);
	}),
);

test(
	'getClipboard() should not equal getClipboard()',
	violentMonkeyContext(t => {
		GM_setClipboard('');

		const clipboard1 = getClipboard();
		const clipboard2 = getClipboard();

		t.not(clipboard1, clipboard2);
		t.deepEqual(clipboard1, clipboard2);
	}),
);
