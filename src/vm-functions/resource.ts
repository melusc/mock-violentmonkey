import {Blob} from 'node:buffer';
import got from 'got';
import {BetterMap} from '../utils';
import {getUserscriptId} from '../violentmonkey-context';

const contextResources = new BetterMap<
	number,
	BetterMap<string, {url: string; text: string}>
>();

const getResourceObject = (name: string) =>
	contextResources.get(getUserscriptId(), () => new BetterMap()).get(name);

const setResource = async (name: string, url: string) => {
	// Throw early if it's an obviously invalid url
	const response = await got(new URL(url));
	const contentType = response.headers['content-type'] ?? 'text/plain';
	const blob = new Blob([response.body], {type: contentType});
	const blobURL = URL.createObjectURL(blob);

	contextResources
		.get(getUserscriptId(), () => new BetterMap())
		.set(name, {
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