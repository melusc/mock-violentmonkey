import crypto from 'node:crypto';

import {getWindow} from '../dom.js';

type AddStyle = (css: string) => HTMLStyleElement;

const addStyle: AddStyle = css => {
	const {document} = getWindow();

	const style = document.createElement('style');
	style.textContent = css;
	style.id = crypto.randomUUID();
	document.head.append(style);
	return style;
};

export {addStyle as GM_addStyle, type AddStyle};

Object.defineProperty(globalThis, 'GM_addStyle', {
	value: addStyle,
});
