import test from 'ava';

import {GM_addStyle, getWindow, violentMonkeyContext} from '../../src/index.js';

test(
	'GM_addStyle should add a style to the current dom',
	violentMonkeyContext(t => {
		const color = 'green';
		const css = `
div {
	color: ${color};
}`;

		const style = GM_addStyle(css);

		t.is(typeof style.id, 'string');
		// 13 is the length in the real world
		t.true(style.id.length >= 13);
		t.is(style.textContent, css);

		t.true(getWindow().document.head.contains(style));

		const div = document.createElement('div');
		document.body.append(div);

		t.is(getWindow().getComputedStyle(div).color, color);
	}),
);
