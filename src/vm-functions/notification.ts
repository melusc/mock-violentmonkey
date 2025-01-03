import {VMStorage} from '../vm-storage.js';

/*
	Because Firefox and Chromium don't behave the same,
	I've added the option to simulate either behaviour with Firefox as default
	I've thought about this and I feel like it should atleast be an option
	because this way bugs might be caught early due to inconsistent behaviour
	Otherwise I'd have to pick one behaviour anyway
*/
const behaveLike = new VMStorage<'Firefox' | 'Chromium'>(() => 'Firefox');
const setNotificationCompat = (platform: 'Firefox' | 'Chromium') => {
	behaveLike.set(platform);
};

const shouldBehaveLikeFirefox = () => {
	const platform = behaveLike.get(true);
	return platform === 'Firefox';
};

const enum NotificationStates {
	visible,
	removed,
}

const notifications = new VMStorage<Set<NotificationHandler>>(() => new Set());

class NotificationHandler {
	text: string;
	title: string | undefined;
	image: string | undefined;
	private readonly onClick: () => void;
	private readonly onDone: () => void;
	private amountRemoveCalled = 0;

	private state: NotificationStates = NotificationStates.visible;

	constructor(options: NotificationOptions) {
		({text: this.text, title: this.title, image: this.image} = options);

		// Don't leak `this`
		this.onDone = () => {
			// eslint-disable-next-line unicorn/no-useless-undefined
			options.ondone?.call(undefined);
		};

		this.onClick = () => {
			// eslint-disable-next-line unicorn/no-useless-undefined
			options.onclick?.call(undefined);
		};

		notifications.get(true).add(this);
	}

	readonly click = () => {
		if (this.state !== NotificationStates.visible) {
			return;
		}

		/**
		 * Firefox: Fire `onclick`, fire `ondone`
		 * Chromium: Fire `onclick`
		 */

		this.onClick();
		this.cleanUp();

		if (shouldBehaveLikeFirefox()) {
			this.onDone();
		}
	};

	readonly close = () => {
		if (this.state !== NotificationStates.visible) {
			return;
		}

		/**
		 * Firefox: Fire `ondone`
		 * Chromium: nothing
		 */

		this.cleanUp();

		if (shouldBehaveLikeFirefox()) {
			this.onDone();
		}
	};

	readonly remove = async () =>
		new Promise<true>(resolve => {
			// No onDone or onClick

			/**
			 * Firefox: If it is already removed, the promise never resolves, if it is not removed, it resolves
			 * Chromium: The promise only resolves the first time (removed or not)
			 */
			if (shouldBehaveLikeFirefox()) {
				if (this.state === NotificationStates.visible) {
					resolve(true);
				}
			} else if (this.amountRemoveCalled === 0) {
				resolve(true);
			}

			++this.amountRemoveCalled;

			this.cleanUp();
		});

	private readonly cleanUp = () => {
		notifications.get(false)?.delete(this);
		this.state = NotificationStates.removed;
	};
}

type NotificationOptions = {
	text: string;
	title?: string | undefined;
	image?: string | undefined;
	onclick?: () => void;
	ondone?: () => void;
};

type Notification = {
	(
		text: string,
		title?: string,
		image?: string,
		onclick?: () => void,
	): {
		remove: () => Promise<true>;
	};
	(options: NotificationOptions): {
		remove: () => Promise<true>;
	};
};

const notification: Notification = (
	text,
	title?: string,
	image?: string,
	onclick?: () => void,
) => {
	const options: NotificationOptions =
		typeof text === 'object'
			? text
			: {
					text,
					title,
					image,
					onclick,
				};

	if (!options.text) {
		throw new Error('GM_notification: `text` is required!');
	}

	const notificationHandler = new NotificationHandler(options);

	return {
		remove: notificationHandler.remove,
	};
};

type Selectors = {
	text: string;
	title: string;
	image: string;
};

const valueMatchesSelector = (value?: string, selector?: string) =>
	selector === undefined || selector === value;
const selectorKeys = ['text', 'image', 'title'] as const;
const findNotificationsBySelectors = (
	selectors: Partial<Selectors>,
): NotificationHandler[] => {
	const allNotifications = notifications.get(false);
	if (!allNotifications) {
		return [];
	}

	const result = [];
	for (const notification of allNotifications) {
		if (
			selectorKeys.every(key =>
				valueMatchesSelector(notification[key], selectors[key]),
			)
		) {
			result.push(notification);
		}
	}

	return result;
};

const findNotifications = (selectors: Partial<Selectors>) => {
	const getNotifications = () => findNotificationsBySelectors(selectors);

	const curriedNotificationFunctionCaller =
		(key: 'remove' | 'click' | 'close') => () => {
			for (const notification of getNotifications()) {
				void notification[key]();
			}
		};

	return {
		/** Remove all notifications matching the selectors */
		remove: curriedNotificationFunctionCaller('remove'),
		/** Click all notifications matching the selectors */
		click: curriedNotificationFunctionCaller('click'),
		/** Close all notifications matching the selectors */
		close: curriedNotificationFunctionCaller('close'),
		/** Count the amount of notifications matching the selectors */
		count: () => getNotifications().length,
	};
};

export {
	notification as GM_notification,
	findNotifications,
	setNotificationCompat,
	type Notification,
};

Object.defineProperty(globalThis, 'GM_notification', {
	value: notification,
});
