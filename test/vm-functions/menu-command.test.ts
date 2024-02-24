import test from 'ava';

import {
	GM_registerMenuCommand,
	GM_unregisterMenuCommand,
	triggerMenuCommand,
	violentMonkeyContext,
} from '../../src/index.js';

test(
	'Normal behaviour',
	violentMonkeyContext(t => {
		let amountCalled = 0;
		const callback = () => {
			++amountCalled;
		};

		const caption = 'caption';

		GM_registerMenuCommand(caption, callback);
		triggerMenuCommand(caption);
		t.is(amountCalled, 1);
		triggerMenuCommand(caption);
		t.is(amountCalled, 2);
		triggerMenuCommand('other-string');
		t.is(amountCalled, 2);

		GM_unregisterMenuCommand(caption);
		triggerMenuCommand(caption);
		t.is(amountCalled, 2);
	}),
);

test(
	"Shouldn't throw when never registering a command",
	violentMonkeyContext(t => {
		t.notThrows(() => {
			triggerMenuCommand('caption');
		});
		t.notThrows(() => {
			GM_unregisterMenuCommand('caption');
		});
	}),
);
