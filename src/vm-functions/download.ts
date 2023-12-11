import {Buffer} from 'node:buffer';

import {VMStorage} from '../vm-storage.js';
import type {Headers} from '../xmlhttprequest/index.js';

import {GM_xmlhttpRequest, type XHREventHandler} from './xmlhttprequest.js';

const downloads = new VMStorage<Map<string, Buffer>>(() => new Map());

// https://violentmonkey.github.io/api/gm/#gm_download
type DownloadOptions = {
	url: string;
	name: string;

	headers?: Headers | undefined;
	timeout?: number | undefined;
	context?: any;
	user?: string | undefined;
	password?: string | undefined;
	anonymous?: boolean | undefined;
	onabort?: XHREventHandler;
	onerror?: XHREventHandler;
	onload?: XHREventHandler | undefined;
	onloadend?: XHREventHandler | undefined;
	onloadstart?: XHREventHandler | undefined;
	onprogress?: XHREventHandler | undefined;
	onreadystatechange?: XHREventHandler | undefined;
	ontimeout?: XHREventHandler | undefined;
};

type Download = {
	(url: string, name: string): void;
	(options: DownloadOptions): void;
};

const download: Download = (options, name?: string) => {
	const options_
		= typeof options === 'string'
			? {
					url: options,
					name: name!,
				}
			: options;

	const {url, name: name_} = options_;

	if (typeof url !== 'string') {
		throw new TypeError('Expected url to be a string.');
	}

	if (typeof name_ !== 'string') {
		throw new TypeError('Expected name to be a string.');
	}

	// This is a fix for a race condition where onloadend is called before onload
	// Because all event handlers but onload were passed without any modification
	// this caused a race condition
	// Our onload was called. Because it is async, onloadend was called, before we could call options_.onload
	// To fix this, we intercept that call and call onloadend when we're ready
	// For errors, we call it right away
	// For onload, we wait until the buffer is loaded and then call their onload and then onloadend

	function overrideError(name: 'error' | 'abort' | 'timeout') {
		return function (response) {
			options_[`on${name}`]?.(response);
			options_.onloadend?.(response);
		} satisfies XHREventHandler;
	}

	GM_xmlhttpRequest({
		...options_,
		url,
		responseType: 'blob',
		async onload(response) {
			const blob = response.response as Blob;
			const buffer = Buffer.from(await blob.arrayBuffer());
			downloads.get(true).set(name_, buffer);

			options_.onload?.(response);
			options_.onloadend?.(response);
		},
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		onloadend() {},
		onerror: overrideError('error'),
		onabort: overrideError('abort'),
		ontimeout: overrideError('timeout'),
	});
};

const getDownloads = (): Record<string, Buffer> => {
	const downloadsMap = downloads.get(false);

	const result: Record<string, Buffer> = {};
	for (const [name, buffer] of downloadsMap ?? []) {
		result[name] = Buffer.from(buffer);
	}

	return result;
};

const getDownload = (name: string) => {
	const buffer = downloads.get(false)?.get(name);

	return buffer && Buffer.from(buffer);
};

export {download as GM_download, getDownloads, getDownload, type Download};

Object.defineProperty(global, 'GM_download', {
	value: download,
});
