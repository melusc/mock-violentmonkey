import test from 'ava';

import {XMLHttpRequest} from '../../src/xmlhttprequest';

test('send before open should throw', t => {
	const xhr = new XMLHttpRequest();

	t.throws(
		() => {
			xhr.send();
		},
		{
			message: /opened/i,
		},
	);
});
