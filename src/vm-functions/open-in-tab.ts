import {VMStorage} from '../violentmonkey-context';

class Tab {
	constructor(
		readonly url: string,
		readonly options: Readonly<Required<OpenInTabOptions>>,
		private readonly onClose: () => void,
	) {}

	close = () => {
		this.onClose();
	};
}

const allTabs = new VMStorage<Set<Tab>>(() => new Set());

type OpenInTabOptions = {
	active?: boolean | undefined;
	container?: number | undefined;
	insert?: boolean | undefined;
	pinned?: boolean;
};
type OpenInTab = (
	url: string,
	options?: OpenInTabOptions | boolean,
) => {
	onclose?: (() => void) | undefined | null;
	closed: boolean;
	close: () => void;
};

const openInTab: OpenInTab = (url, options = {}) => {
	options
		= typeof options === 'boolean'
			? {
					active: !options,
			  }
			: options;

	const fullOptions: Required<OpenInTabOptions> = {
		active: options.active ?? true,
		container: options.container ?? 0,
		insert: options.insert ?? true,
		pinned: options.pinned ?? false,
	};

	const onClose = () => {
		allTabs.get(true).delete(tab);
		returnValue.closed = true;
		returnValue.onclose?.();
	};

	const tab = new Tab(url, fullOptions, onClose);
	allTabs.get(true).add(tab);

	const returnValue: ReturnType<OpenInTab> = {
		onclose: null,
		closed: false,
		close: tab.close,
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
