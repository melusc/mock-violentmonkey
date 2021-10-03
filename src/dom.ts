import got from 'got';

import {JSDOM, DOMWindow} from 'jsdom';
import {BetterMap} from './utils';
import {getUserscriptId} from './violentmonkey-context';

const storedJSDOMs = new BetterMap<number, JSDOM>();

/** @internal */
export const getJSDOM = () =>
	storedJSDOMs.get(getUserscriptId(), () => new JSDOM('<!doctype html>'));
export const getWindow = () => getJSDOM().window;

/**
 * Load the page at the given url to the dom
 */
export const loadURLToDom = async (url: string) => {
	// Convert to a URL instance to throw early on obviously invalid urls
	const body = await got(new URL(url));

	loadStringToDom(body.body);
};

/**
 * Set document.documentElement.outerHTML to passed string
 */
export const loadStringToDom = (outerHTML: string) => {
	getWindow().document.documentElement.innerHTML = outerHTML;
};

Object.defineProperties(global, {
	window: {
		get: getWindow,
	},
});

// https://github.com/microsoft/TypeScript/issues/41966#issuecomment-758187996
type MapKnownKeys<T> = {
	[K in keyof T as string extends K ? never : K]: string;
};

const JSDomGlobalsKeys: ReadonlyArray<keyof MapKnownKeys<DOMWindow>> = [
	'Blob',
	'document',
] as const;

for (const key of JSDomGlobalsKeys) {
	Object.defineProperty(global, key, {
		get: (): any => getWindow()[key],
	});
}
