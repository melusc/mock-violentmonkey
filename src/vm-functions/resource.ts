import {Blob} from 'node:buffer';
import got from 'got';
import {BetterMap} from '../utils';
import {VMStorage} from '../vm-storage';

const contextResources = new VMStorage<
	BetterMap<string, {url: string; text: string}>
>(() => new BetterMap());

const getResourceObject = (name: string) =>
	contextResources.get(true).get(name);

const setResource = async (name: string, url: string) => {
	url = url.trim();

	if (!url.startsWith('http://') && !url.startsWith('https://')) {
		throw new Error(`Expected an http(s) url, got ${url} instead`);
	}

	// Throw early if it's an obviously invalid url
	const response = await got(new URL(url));
	const contentType = response.headers['content-type'] ?? 'text/plain';
	const blob = new Blob([response.body], {type: contentType});
	const blobURL = URL.createObjectURL(blob);

	contextResources.get(true).set(name, {
		url: blobURL,
		text: response.body,
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
	/*****/
	GetResourceText,
	GetResourceURL,
};

Object.defineProperties(global, {
	GM_getResourceURL: {
		value: getResourceURL,
	},
	GM_getResourceText: {
		value: getResourceText,
	},
});
