import {resolveObjectURL} from 'node:buffer';

import test from 'ava';

import {
	setResource,
	GM_getResourceText,
	GM_getResourceURL,
	violentMonkeyContext,
	GM_info,
} from '../../src/index.js';

test(
	'gist.github.com test.txt',
	violentMonkeyContext(async t => {
		t.plan(4);

		const filename = 'test.txt';
		await setResource(
			filename,
			'https://gist.github.com/melusc/e8e22d8e0f30dd71660ff2272663b25c/raw/3cbcf9cb0b60ee0dc6e5766746615cf5d47f0563/test.txt',
		);

		const text = GM_getResourceText(filename);
		const url = GM_getResourceURL(filename);
		const expectedText = 'Hello world!\n\n1234';

		t.is(typeof url, 'string');
		t.is(text, expectedText);

		t.regex(url!, /blob:/);

		t.is(await resolveObjectURL(url!)?.text(), expectedText);
	}),
);

test(
	'example.org',
	violentMonkeyContext(async t => {
		t.plan(5);

		const filename = 'test.txt';
		const exampleOrgRegex = /<div>\s*<h1>example domain<\/h1>/i;
		await setResource(filename, 'https://example.org/');

		const text = GM_getResourceText(filename);
		const url = GM_getResourceURL(filename);

		t.is(typeof url, 'string');
		t.is(typeof text, 'string');

		t.regex(text!, exampleOrgRegex);
		t.regex(url!, /blob:/);

		t.regex((await resolveObjectURL(url!)?.text())!, exampleOrgRegex);
	}),
);

test(
	'invalid Urls',
	violentMonkeyContext(async t => {
		await t.throwsAsync(
			async () => {
				await setResource('name', '/f');
			},
			{
				message: /\/f/,
			},
		);

		await t.throwsAsync(
			async () => {
				await setResource('name2', 'blob:nodedata:abcd');
			},
			{
				message: /blob:nodedata:abcd/,
			},
		);

		const error3 = await t.throwsAsync(async () => {
			await setResource('name3', 'https://');
		});
		t.true(error3 instanceof TypeError);
	}),
);

test(
	'GM_resource should update GM_info.script.resources',
	violentMonkeyContext(async t => {
		t.deepEqual(GM_info().script.resources, []);

		await setResource(
			'resource1',
			'https://httpbin.org/base64/R01fcmVzb3VyY2U=',
		);

		t.deepEqual(GM_info().script.resources, [
			{
				name: 'resource1',
				url: 'https://httpbin.org/base64/R01fcmVzb3VyY2U=',
			},
		]);

		await setResource('resource2', 'https://httpbin.org/bytes/3');

		t.deepEqual(GM_info().script.resources, [
			{
				name: 'resource1',
				url: 'https://httpbin.org/base64/R01fcmVzb3VyY2U=',
			},
			{
				name: 'resource2',
				url: 'https://httpbin.org/bytes/3',
			},
		]);

		await setResource('resource1', 'https://httpbin.org/uuid');

		t.deepEqual(GM_info().script.resources, [
			{
				name: 'resource1',
				url: 'https://httpbin.org/uuid',
			},
			{
				name: 'resource2',
				url: 'https://httpbin.org/bytes/3',
			},
		]);
	}),
);
