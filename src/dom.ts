import {JSDOM, DOMWindow} from 'jsdom';
import {VMStorage} from './vm-storage';
import {getBaseUrl} from './base-url';
import {XMLHttpRequest} from './xmlhttprequest';

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

/**
 * Enable a global dom value.
 * This allows you to enable only what you need.
 */
const enableDomGlobal = (key: keyof MapKnownKeys<DOMWindow>) => {
	Object.defineProperty(global, key, {
		get: (): any => getWindow()[key],
	});
};

enableDomGlobal('window');
enableDomGlobal('document');

export {getWindow, getJSDOM, loadURLToDom, loadStringToDom, enableDomGlobal};
