import {VMStorage} from '../vm-storage.js';

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

	private state: NotificationStates = NotificationStates.visible;

	constructor(options: NotificationOptions) {
		({text: this.text, title: this.title, image: this.image} = options);

		// Don't leak `this`
		this.onDone = () => {
			 
			options.ondone?.call(undefined);
		};

		this.onClick = () => {
			 
			options.onclick?.call(undefined);
		};

		notifications.get(true).add(this);
	}

	readonly click = () => {
		if (this.state !== NotificationStates.visible) {
			return;
		}

		this.onClick();
		this.cleanUp();
		this.onDone();
	};

	readonly close = () => {
		if (this.state !== NotificationStates.visible) {
			return;
		}

		this.cleanUp();
		this.onDone();
	};

	readonly remove = async () =>
		new Promise<true>(resolve => {
			if (this.state === NotificationStates.visible) {
				resolve(true);
			}

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

export {notification as GM_notification, findNotifications, type Notification};

Object.defineProperty(globalThis, 'GM_notification', {
	value: notification,
});
