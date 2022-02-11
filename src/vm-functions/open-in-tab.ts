import {VMStorage} from '../vm-storage.js';

type Tab = Readonly<{
	url: string;
	options: Required<OpenInTabOptions>;
	close: () => void;
}>;

const allTabs = new VMStorage<Set<Tab>>(() => new Set());

type OpenInTabOptions = {
	active?: boolean | undefined;
	container?: number | undefined;
	insert?: boolean | undefined;
	pinned?: boolean | undefined;
};
type OpenInTab = (
	url: string,
	options?: OpenInTabOptions | boolean,
) => {
	// eslint-disable-next-line @typescript-eslint/ban-types
	onclose?: (() => void) | undefined | null;
	closed: boolean;
	close: () => void;
};

const toFullOptions = (
	options: OpenInTabOptions | boolean | undefined,
): Required<OpenInTabOptions> => {
	options ??= {};
	options = typeof options === 'boolean' ? {active: !options} : options;

	return {
		active: options.active ?? true,
		container: options.container ?? 0,
		insert: options.insert ?? true,
		pinned: options.pinned ?? false,
	};
};

const openInTab: OpenInTab = (url, options) => {
	const close = () => {
		allTabs.get(true).delete(tab);
		returnValue.closed = true;
		returnValue.onclose?.();
	};

	const tab: Tab = {
		url,
		options: toFullOptions(options),
		close,
	};
	allTabs.get(true).add(tab);

	const returnValue: ReturnType<OpenInTab> = {
		onclose: null,
		closed: false,
		close,
	};

	return returnValue;
};

const getTabs = (url?: string | RegExp): Tab[] => {
	const tabs = allTabs.get(false);
	if (!tabs) {
		return [];
	}

	if (url === undefined) {
		return [...tabs];
	}

	const result: Tab[] = [];

	const matchesUrl = (url_: string) =>
		url instanceof RegExp ? url.test(url_) : url_ === url;

	for (const tab of tabs) {
		if (matchesUrl(tab.url)) {
			result.push(tab);
		}
	}

	return result;
};

export {openInTab as GM_openInTab, getTabs, OpenInTab};

Object.defineProperty(global, 'GM_openInTab', {
	value: openInTab,
});
