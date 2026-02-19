import test from 'ava';

import {GM_openInTab, getTabs, violentMonkeyContext} from '../../src/index.js';

test(
	'GM_openInTab normal behaviour',
	violentMonkeyContext(t => {
		const tab1 = GM_openInTab('https://example.com/', {
			pinned: false,
			active: true,
			insert: false,
			container: 2,
		});

		t.false(tab1.closed);

		let amountCalled = 0;
		// eslint-disable-next-line unicorn/prefer-add-event-listener
		tab1.onclose = () => {
			++amountCalled;
		};

		tab1.close();
		t.is(amountCalled, 1);
		t.true(tab1.closed);
	}),
);

test(
	'GM_openInTab with options as a boolean',
	violentMonkeyContext(t => {
		GM_openInTab('false', false);
		const tab1 = getTabs('false')[0];

		t.like(tab1?.options, {
			active: true,
		});

		GM_openInTab('true', true);
		const tab2 = getTabs('true')[0];

		t.like(tab2?.options, {
			active: false,
		});
	}),
);

test(
	'getTabs',
	violentMonkeyContext(t => {
		t.is(getTabs().length, 0);

		const amountOnCloseCalled: Record<number, number> = {};
		const createTab = (notificationId: number) => {
			const notification = GM_openInTab(
				`https://example.com/${notificationId}`,
			);

			// eslint-disable-next-line unicorn/prefer-add-event-listener
			notification.onclose = () => {
				amountOnCloseCalled[notificationId] ??= 0;
				++amountOnCloseCalled[notificationId];

				t.is(notification.closed, true);
			};
		};

		let tabIndex = 0;
		createTab(tabIndex++);
		createTab(tabIndex++);
		createTab(tabIndex);

		const tabs = getTabs();
		t.is(tabs.length, 3);

		t.is(getTabs('https://example.com/3').length, 0);
		t.is(getTabs('https://example.com/0').length, 1);
		t.is(getTabs(/^https:\/\/example\.com/i).length, 3);

		for (const [tabIndex, tab] of tabs.entries()) {
			t.is(tab.url, `https://example.com/${tabIndex}`);
			t.deepEqual(tab.options, {
				active: true,
				container: 0,
				insert: true,
				pinned: false,
			});

			tab.close();
		}

		t.is(getTabs().length, 0);
		t.deepEqual(amountOnCloseCalled, {0: 1, 1: 1, 2: 1});
	}),
);
