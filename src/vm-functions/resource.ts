import {Blob} from 'node:buffer';
import {URL} from 'node:url';
import {BetterMap} from '../utils/index.js';
import {VMStorage} from '../vm-storage.js';
import {XMLHttpRequest} from '../xmlhttprequest/index.js';
import {GM_info} from './info.js';

const contextResources = new VMStorage<
	BetterMap<string, {url: string; text: string}>
>(() => new BetterMap());

const getResourceObject = (name: string) =>
	contextResources.get(true).get(name);

const setResource = async (name: string, url: string) => {
	url = url.trim();

	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		throw new Error(`Expected an absolute http url, got ${url} instead`);
	}

	// Throw early if it's an obviously invalid url
	url = new URL(url).href;

	await new Promise<void>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.addEventListener('load', () => {
			const contentType
				= (xhr.getResponseHeader('content-type') as string | undefined)
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				|| 'text/plain';
			const blob = new Blob([xhr.responseBuffer], {type: contentType});
			const blobURL = URL.createObjectURL(blob);

			contextResources.get(true).set(name, {
				url: blobURL,
				text: xhr.responseBuffer.toString(),
			});

			const {resources} = GM_info().script;

			for (const resource of resources) {
				if (resource.name === name) {
					resource.url = url;
					resolve();
					return;
				}
			}

			resources.push({
				name,
				url,
			});

			resolve();
		});

		xhr.addEventListener('error', reject);
		xhr.open('get', url);
		xhr.send();
	});
};

type GetResourceText = (name: string) => string | undefined;
const getResourceText: GetResourceText = name => getResourceObject(name)?.text;

type GetResourceURL = (name: string) => string | undefined;
const getResourceURL: GetResourceURL = name => getResourceObject(name)?.url;

export {
	setResource,
	getResourceText as GM_getResourceText,
	getResourceURL as GM_getResourceURL,
	type GetResourceText,
	type GetResourceURL,
};

Object.defineProperties(global, {
	GM_getResourceURL: {
		value: getResourceURL,
	},
	GM_getResourceText: {
		value: getResourceText,
	},
});
