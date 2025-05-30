import {JSDOM, type DOMWindow} from 'jsdom';

import {getBaseUrl} from './base-url.js';
import {VMStorage} from './vm-storage.js';
import {XMLHttpRequest} from './xmlhttprequest/index.js';

const storedJSDOMs = new VMStorage<JSDOM>(
	() =>
		new JSDOM('<!doctype html>', {
			url: getBaseUrl().href,
		}),
);

/** @internal */
const getJSDOM = () => storedJSDOMs.get(true);
const getWindow = () => getJSDOM().window;

/**
 * Load the page at the given url to the dom
 */
const loadURLToDom = async (url: string) => {
	// Convert to a URL instance to throw early on obviously invalid urls
	url = new URL(url).href;

	const xhr = new XMLHttpRequest({
		base: getBaseUrl(),
	});

	await new Promise<void>((resolve, reject) => {
		xhr.addEventListener('load', () => {
			loadStringToDom(xhr.responseBuffer.toString());
			resolve();
		});
		xhr.addEventListener('error', reject);

		xhr.open('get', new URL(url).href);
		xhr.send();
	});
};

/**
 * Set document.documentElement.outerHTML to passed string
 */
const loadStringToDom = (outerHTML: string) => {
	getWindow().document.documentElement.innerHTML = outerHTML;
};

// https://github.com/microsoft/TypeScript/issues/41966#issuecomment-758187996
type MapKnownKeys<T> = {
	[K in keyof T as string extends K ? never : K]: string;
};

const builtinGlobals: ReadonlySet<keyof MapKnownKeys<DOMWindow>> = new Set([
	'URL',
	'Blob',
	'File',
	'FormData',
]);

/**
 * Enable a global dom value.
 * This allows you to enable only what you need.
 */
function enableDomGlobal(key: keyof MapKnownKeys<DOMWindow>) {
	if (builtinGlobals.has(key)) {
		console.warn(
			'Warning(mock-violentmonkey):' +
				` enableDomGlobal("${key}") is not necessary anymore.` +
				` Please use the built-in version of \`${key}\` instead.`,
		);
	}

	Object.defineProperty(globalThis, key, {
		get(): unknown {
			return getWindow()[key];
		},
	});
}

enableDomGlobal('window');
enableDomGlobal('document');

export {getWindow, getJSDOM, loadURLToDom, loadStringToDom, enableDomGlobal};
