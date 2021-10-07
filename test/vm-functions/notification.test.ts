import {setTimeout} from 'node:timers/promises';

import test from 'ava';

import {
	findNotifications,
	GM_notification,
	setNotificationCompat,
	violentMonkeyContext,
} from '../../src';

test(
	'Letting notification timeout',
	violentMonkeyContext(async t => {
		t.timeout(1000);

		const amountCalled = {
			ondone: 0,
			onclick: 0,
		};

		await new Promise<void>(resolve => {
			GM_notification({
				text: 'f',
				ondone: () => {
					++amountCalled.ondone;
					resolve();
				},
				onclick: () => {
					++amountCalled.onclick;
				},
			});
		});

		t.deepEqual(amountCalled, {
			ondone: 1,
			onclick: 0,
		});

		t.is(findNotifications({}).count(), 0);
	}),
);

test(
	'Clicking a notification (Firefox)',
	violentMonkeyContext(async t => {
		setNotificationCompat('Firefox');

		t.timeout(1000);

		const amountCalled = {
			ondone: 0,
			onclick: 0,
		};

		const text = 'notification-text';

		const promise = new Promise<void>(resolve => {
			GM_notification({
				text,
				ondone: () => {
					++amountCalled.ondone;
					resolve();
				},
				onclick: () => {
					++amountCalled.onclick;
				},
			});
		});

		findNotifications({
			text,
		}).click();

		await promise;

		t.deepEqual(amountCalled, {
			ondone: 1,
			onclick: 1,
		});

		t.is(findNotifications({}).count(), 0);
	}),
);

test(
	'Clicking a notification (Chromium)',
	violentMonkeyContext(async t => {
		setNotificationCompat('Chromium');

		t.timeout(1000);

		const amountCalled = {
			ondone: 0,
			onclick: 0,
		};

		const text = 'notification-text';

		const promise = new Promise<void>(resolve => {
			GM_notification({
				text,
				ondone: () => {
					++amountCalled.ondone;
				},
				onclick: () => {
					resolve();
					++amountCalled.onclick;
				},
			});
		});

		findNotifications({
			text,
		}).click();

		await promise;

		t.deepEqual(amountCalled, {
			ondone: 0,
			onclick: 1,
		});

		t.is(findNotifications({}).count(), 0);
	}),
);

test(
	'Closing a notification (Firefox)',
	violentMonkeyContext(async t => {
		t.timeout(1000);

		setNotificationCompat('Firefox');

		const amountCalled = {
			ondone: 0,
			onclick: 0,
		};

		const text = 'notification-text';

		const promise = new Promise<void>(resolve => {
			GM_notification({
				text,
				ondone: () => {
					++amountCalled.ondone;
					resolve();
				},
				onclick: () => {
					++amountCalled.onclick;
				},
			});
		});

		findNotifications({
			text,
		}).close();

		await promise;

		t.deepEqual(amountCalled, {
			ondone: 1,
			onclick: 0,
		});

		t.is(findNotifications({}).count(), 0);
	}),
);

test(
	'Closing a notification (Chromium)',
	violentMonkeyContext(async t => {
		t.timeout(1000);

		setNotificationCompat('Chromium');

		const amountCalled = {
			ondone: 0,
			onclick: 0,
		};

		const text = 'notification-text';

		GM_notification({
			text,
			ondone: () => {
				++amountCalled.ondone;
			},
			onclick: () => {
				++amountCalled.onclick;
			},
		});

		findNotifications({
			text,
		}).close();

		t.is(findNotifications({}).count(), 0);

		await setTimeout(100);

		t.deepEqual(amountCalled, {
			ondone: 0,
			onclick: 0,
		});
	}),
);

test(
	'Removing a notification before it has been removed (Firefox)',
	violentMonkeyContext(async t => {
		/*
		 Expect the first call to remove() to resolve
		 Expect the second call to remove() to never resolve

		 Expect (ondone,onclick) to never be called
		*/

		setNotificationCompat('Firefox');

		t.timeout(3000);

		const text = 'notification-text';

		const notification = GM_notification({
			text,
			ondone: () => {
				t.fail();
			},
			onclick: () => {
				t.fail();
			},
		});

		t.is(await notification.remove(), true);

		t.is(findNotifications({}).count(), 0);

		const sym = Symbol('');
		t.is(
			await Promise.race([setTimeout(100, sym), notification.remove()]),
			sym,
		);
	}),
);

test(
	'Removing a notification before it has been removed (Chromium)',
	violentMonkeyContext(async t => {
		/*
		 Expect the first call to remove() to resolve
		 Expect the second call to remove() to never resolve

		 Expect (ondone,onclick) to never be called
		*/

		setNotificationCompat('Chromium');

		t.timeout(3000);

		const text = 'notification-text';

		const notification = GM_notification({
			text,
			ondone: () => {
				t.fail();
			},
			onclick: () => {
				t.fail();
			},
		});

		t.is(await notification.remove(), true);

		const sym = Symbol('');
		t.is(
			await Promise.race([setTimeout(100, sym), notification.remove()]),
			sym,
		);

		t.is(findNotifications({}).count(), 0);
	}),
);

test(
	'Removing a notification after it has been removed (Firefox)',
	violentMonkeyContext(async t => {
		/*
		 Expect onclick to never be called
		 Expect ondone to be never be called

		 Expect the first call to remove() to never resolve (since it's already removed)
		*/

		setNotificationCompat('Firefox');

		t.timeout(3000);

		const text = 'notification-text';

		let amountOnDoneCalled = 0;

		const notification = GM_notification({
			text,
			ondone: () => {
				++amountOnDoneCalled;
			},
			onclick: () => {
				t.fail();
			},
		});

		await setTimeout(100);

		t.is(amountOnDoneCalled, 1);

		t.is(findNotifications({}).count(), 0);

		const sym = Symbol('');
		t.is(
			await Promise.race([setTimeout(100, sym), notification.remove()]),
			sym,
		);
	}),
);

test(
	'Removing a notification after it has been removed (Chromium)',
	violentMonkeyContext(async t => {
		/*
		 Expect onclick to never be called
		 Expect ondone to never be called

		 Expect the first call to remove() to resolve (even though it's already removed)
		 Expect the second call to remove() to resolve
		*/

		setNotificationCompat('Chromium');

		t.timeout(3000);

		const text = 'notification-text';

		const notification = GM_notification({
			text,
			ondone: () => {
				t.fail();
			},
			onclick: () => {
				t.fail();
			},
		});

		// Timeout is 50ms
		await setTimeout(100);

		t.is(findNotifications({}).count(), 0);

		t.is(await notification.remove(), true);

		const sym = Symbol('');
		t.is(
			await Promise.race([setTimeout(100, sym), notification.remove()]),
			sym,
		);
	}),
);

test(
	'Find notifications by (text, image, title)',
	violentMonkeyContext(t => {
		GM_notification({text: 'text1', title: 'title1', image: 'image'});
		GM_notification({text: 'text2', title: 'title2', image: 'image'});

		t.is(findNotifications({}).count(), 2);
		t.is(findNotifications({text: 'text1'}).count(), 1);
		t.is(findNotifications({title: 'title1'}).count(), 1);
		t.is(findNotifications({image: 'image'}).count(), 2);
		t.is(findNotifications({text: 'text1', image: 'image'}).count(), 1);
		t.is(findNotifications({text: 'text1', image: 'image3'}).count(), 0);
		t.is(findNotifications({title: 'title1'}).count(), 1);
		t.is(findNotifications({title: 'title1', image: 'image'}).count(), 1);
		t.is(
			findNotifications({
				title: 'title1',
				image: 'image',
				text: 'text1',
			}).count(),
			1,
		);
		t.is(
			findNotifications({
				title: 'title1',
				image: 'image',
				text: 'text3',
			}).count(),
			0,
		);
		t.is(
			findNotifications({
				title: 'title3',
				image: 'image3',
				text: 'text3',
			}).count(),
			0,
		);

		GM_notification({text: 'text3', title: 'title3', image: 'image'});

		t.is(findNotifications({}).count(), 3);
		t.is(
			findNotifications({
				title: 'title3',
				image: 'image',
				text: 'text3',
			}).count(),
			1,
		);

		const foundNotifications1 = findNotifications({});
		t.is(foundNotifications1.count(), 3);
		GM_notification({text: 'text4', title: 'title4', image: 'image'});

		t.is(foundNotifications1.count(), 4);

		foundNotifications1.close();
		t.is(findNotifications({}).count(), 0);
	}),
);
