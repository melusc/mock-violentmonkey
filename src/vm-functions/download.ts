import {Buffer, type Blob} from 'node:buffer';

import {VMStorage} from '../vm-storage.js';
import type {Headers} from '../xmlhttprequest/index.js';
import {type XHREventHandler, GM_xmlhttpRequest} from './xmlhttprequest.js';

const downloads = new VMStorage<Map<string, Buffer>>(() => new Map());

type DownloadOptions = {
	url: string;
	name: string;
	onload?: XHREventHandler | undefined;
	timeout?: number | undefined;
	headers?: Headers | undefined;
	onerror?: XHREventHandler | undefined;
	onprogress?: XHREventHandler | undefined;
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

	GM_xmlhttpRequest({
		url,
		timeout: options_.timeout,
		responseType: 'blob',
		async onload(response) {
			const blob = response.response as Blob;
			const buffer = Buffer.from(await blob.arrayBuffer());

			downloads.get(true).set(name_, buffer);

			const {onload} = options_;
			if (typeof onload === 'function') {
				onload(response);
			}
		},
		headers: options_.headers,
		onerror: options_.onerror,
		onprogress: options_.onprogress,
		ontimeout: options_.ontimeout,
	});
};

const getDownloads = (): Record<string, Buffer> => {
	const downloadsMap = downloads.get(false);

	const result: Record<string, Buffer> = {};
	for (const [name, buffer] of downloadsMap ?? []) {
		result[name] = buffer.slice();
	}

	return result;
};

const getDownload = (name: string) => downloads.get(false)?.get(name)?.slice();

export {download as GM_download, getDownloads, getDownload, type Download};

Object.defineProperty(global, 'GM_download', {
	value: download,
});
