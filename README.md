# mock-violentmonkey

[![NPM](https://img.shields.io/npm/v/mock-violentmonkey.svg?style=flat)](https://npmjs.org/package/mock-violentmonkey)
[![License](https://img.shields.io/npm/l/mock-violentmonkey.svg?style=flat)](https://github.com/melusc/mock-violentmonkey)
[![Dependencies](https://img.shields.io/david/melusc/mock-violentmonkey)](https://github.com/melusc/mock-violentmonkey)

mock-violentmonkey allows you to mock Violentmonkey's api for testing Violentmonkey userscripts.
mock-violentmonkey allows you to have seperated contexts for testing different scenarious without them interfering with each other.
It was written with ava in mind but should work with other test runners.

## api

### violentMonkeyContext

This the magic sauce. violentMonkeyContext seperates the various testing contexts from each other. This allows you to use `GM_setValue` and the like and not worry about it affecting other tests.

```js
test(
	'title1',
	violentMonkeyContext(t => {
		// This is seperate
	}),
);

test(
	'title2',
	violentMonkeyContext(t => {
		// from here
	}),
);
```

### tabContext

This allows you to simulate seperate tabs. It is currently only useful for `GM_addValueChangeListener` and `GM_removeValueChangeListener`.

```js
test(
	'title',
	violentMonkeyContext(t => {
		GM_addValueChangeListener('key', (key, oldValue, newValue, remote) => {
			console.log(remote);
		});

		GM_setValue('key', 1); // Will log false

		tabContext(() => {
			GM_setValue('key', 2); // Will log true
		});
	}),
);
```

## GM api

✔️ = supported,
❌ = not supported,
⚠️ = supported, see footnotes

| Function                                                                                                                        | Support |
| ------------------------------------------------------------------------------------------------------------------------------- | ------- |
| [`GM_info` / `GM.info`](https://violentmonkey.github.io/api/gm/#gm_info) [^gm-info-defaults]                                    | ✔️      |
| [`GM_getValue` / `GM.getValue`](https://violentmonkey.github.io/api/gm/#gm_getvalue)                                            | ✔️      |
| [`GM_setValue` / `GM.setValue`](https://violentmonkey.github.io/api/gm/#gm_setvalue)                                            | ✔️      |
| [`GM_deleteValue` / `GM.deleteValue`](https://violentmonkey.github.io/api/gm/#gm_deletevalue)                                   | ✔️      |
| [`GM_listValues` / `GM.listValues`](https://violentmonkey.github.io/api/gm/#gm_listvalues)                                      | ✔️      |
| [`GM_addValueChangeListener`](https://violentmonkey.github.io/api/gm/#gm_addvaluechangelistener)                                | ✔️      |
| [`GM_removeValueChangeListener`](https://violentmonkey.github.io/api/gm/#gm_removevaluechangelistener)                          | ✔️      |
| [`GM_getResourceText`](https://violentmonkey.github.io/api/gm/#gm_getresourcetext)                                              | ✔️      |
| [`GM_getResourceURL` / `GM.getResourceURL`](https://violentmonkey.github.io/api/gm/#gm_getresourceurl) [^get-resource-url-note] | ⚠️      |
| [`GM_addStyle` / `GM.addStyle`](https://violentmonkey.github.io/api/gm/#gm_addstyle)                                            | ✔️      |
| [`GM_openInTab` / `GM.openInTab`](https://violentmonkey.github.io/api/gm/#gm_openintab)                                         | ❌      |
| [`GM_registerMenuCommand`](https://violentmonkey.github.io/api/gm/#gm_registermenucommand)                                      | ✔️      |
| [`GM_unregisterMenuCommand`](https://violentmonkey.github.io/api/gm/#gm_unregistermenucommand)                                  | ✔️      |
| [`GM_notification` / `GM.notification`](https://violentmonkey.github.io/api/gm/#gm_notification)                                | ❌      |
| [`GM_setClipboard` / `GM.setClipboard`](https://violentmonkey.github.io/api/gm/#gm_setclipboard)                                | ❌      |
| [`GM_xmlhttpRequest` / `GM.xmlHttpRequest`](https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest)                          | ❌      |
| [`GM_download`](https://violentmonkey.github.io/api/gm/#gm_download)                                                            | ❌      |

[^gm-info-defaults]: [`GM_info` / `GM.info` default value](https://github.com/melusc/mock-violentmonkey/blob/e00f5460dba990decd1a37edd9329b53751a9b8e/src/vm-functions/info.ts#L55-L79)
[^get-resource-url-note]: Because `GM_getResourceURL` and `GM.getResourceURL` return an object url and object urls can't be called with regular http libraries (in node), only with [`buffer.resolveObjectURL`](https://nodejs.org/dist/latest-v16.x/docs/api/buffer.html#buffer_buffer_resolveobjecturl_id), I don't recommend using this currently.

The GM\_\* and GM.\* api is added to the global scope so that userscripts have access to them.
With Typescript you can either [import them](https://github.com/melusc/mock-violentmonkey/blob/e00f5460dba990decd1a37edd9329b53751a9b8e/test/vm-functions/storage.test.ts#L6-L11) or [tell Typescript that they're globals](https://github.com/melusc/mock-violentmonkey/blob/e00f5460dba990decd1a37edd9329b53751a9b8e/test/vm-functions/globals.test.ts#L19-L25).

If you import `GM_info` it is not a getter, you have to call it.

```js
import {GM_info} from 'mock-violentmonkey';
test(
	'title',
	violentMonkeyContext(t => {
		console.log(GM_info());
	}),
);
```

```ts
import {ScriptInfo} from 'mock-violentmonkey';

declare const GM_info: ScriptInfo;

test(
	'title',
	violentMonkeyContext(t => {
		console.log(GM_info);
	}),
);
```

## Additional GM api

Additionally, mock-violentmonkey has some helper functions for setting up tests.

### update_GM_info

This provides an easy way of updating `GM_info` / `GM.info`. The object is mutable but `update_GM_info` provides an easy way of updating it in one go.

```js
test(
	'title',
	violentMonkeyContext(t => {
		update_GM_info({
			version: '2.0.0', // Version of Violentmonkey
			platform: {
				// Supports deep assignment
				arch: 'arm', // update platform arch
			},
			script: {
				version: '1.5.2', // Version of userscript
				matches: ['https://github.com/*'], // Merges old array and new array
			},
		});

		// Same as
		GM_info.version = '2.0.0';
		GM_info.platform.arch = 'arm';
		GM_info.script.version = '1.5.2';
		GM_info.script.matches.push('https://github.com/*');
	}),
);
```

### setResource

Because mock-violentmonkey can't access the headers you need to make sure to add the resources manually before testing code that requires `@resource` tags.

```ts
type SetResource = (name: string, url: string) => Promise<string>;
```

```js
// In the userscript
// @resource	example.org https://example.org

// When testing
await setResource('example.org', 'https://example.org/');
```

### triggerMenuCommand

Because there's no UI a different method of triggering menu commands is necessary. To simulate clicking a menu command you can use this command instead.

```js
GM_registerMenuCommand('Open settings', openSettings);
triggerMenuCommand('Open settings'); // Calls `openSettings`
```

## License

MIT
