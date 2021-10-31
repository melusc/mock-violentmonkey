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
❌ = not supported

| Function                                                                                               | Support | Notes                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`GM_info` / `GM.info`](https://violentmonkey.github.io/api/gm/#gm_info)                               | ✔️      | [Default value](https://github.com/melusc/mock-violentmonkey/blob/e00f5460dba990decd1a37edd9329b53751a9b8e/src/vm-functions/info.ts#L55-L79)                                                                       |
| [`GM_getValue` / `GM.getValue`](https://violentmonkey.github.io/api/gm/#gm_getvalue)                   | ✔️      |                                                                                                                                                                                                                    |
| [`GM_setValue` / `GM.setValue`](https://violentmonkey.github.io/api/gm/#gm_setvalue)                   | ✔️      |                                                                                                                                                                                                                    |
| [`GM_deleteValue` / `GM.deleteValue`](https://violentmonkey.github.io/api/gm/#gm_deletevalue)          | ✔️      |                                                                                                                                                                                                                    |
| [`GM_listValues` / `GM.listValues`](https://violentmonkey.github.io/api/gm/#gm_listvalues)             | ✔️      |                                                                                                                                                                                                                    |
| [`GM_addValueChangeListener`](https://violentmonkey.github.io/api/gm/#gm_addvaluechangelistener)       | ✔️      |                                                                                                                                                                                                                    |
| [`GM_removeValueChangeListener`](https://violentmonkey.github.io/api/gm/#gm_removevaluechangelistener) | ✔️      |                                                                                                                                                                                                                    |
| [`GM_getResourceText`](https://violentmonkey.github.io/api/gm/#gm_getresourcetext)                     | ✔️      |                                                                                                                                                                                                                    |
| [`GM_getResourceURL` / `GM.getResourceURL`](https://violentmonkey.github.io/api/gm/#gm_getresourceurl) | ✔️      | This returns an object url, which cannot be fetched with regular http libs in node, use `GM_getResourceText` instead.                                                                                              |
| [`GM_addStyle` / `GM.addStyle`](https://violentmonkey.github.io/api/gm/#gm_addstyle)                   | ✔️      |                                                                                                                                                                                                                    |
| [`GM_openInTab` / `GM.openInTab`](https://violentmonkey.github.io/api/gm/#gm_openintab)                | ✔️      |                                                                                                                                                                                                                    |
| [`GM_registerMenuCommand`](https://violentmonkey.github.io/api/gm/#gm_registermenucommand)             | ✔️      |                                                                                                                                                                                                                    |
| [`GM_unregisterMenuCommand`](https://violentmonkey.github.io/api/gm/#gm_unregistermenucommand)         | ✔️      |                                                                                                                                                                                                                    |
| [`GM_notification` / `GM.notification`](https://violentmonkey.github.io/api/gm/#gm_notification)       | ✔️      | Because Chromium and Firefox's notifications behave slightly different, mock-violentmonkey's implementation allows you to simulate either with Firefox's behaviour by default. [More info](#setnotificationcompat) |
| [`GM_setClipboard` / `GM.setClipboard`](https://violentmonkey.github.io/api/gm/#gm_setclipboard)       | ✔️      | This doesn't actually set the clipboard.                                                                                                                                                                           |
| [`GM_xmlhttpRequest` / `GM.xmlHttpRequest`](https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest) | ❌      |                                                                                                                                                                                                                    |
| [`GM_download`](https://violentmonkey.github.io/api/gm/#gm_download)                                   | ❌      |                                                                                                                                                                                                                    |

The `GM_*` and `GM.*` api is added to the global scope so that userscripts have access to them.
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

### setNotificationTimeout

This sets the time after which the notification will timeout and be removed (like closing a notification). Defaults to 50ms. The notification takes the value at the time of creating the notification.

```ts
type SetNotificationTimeout = (timeout: number) => void;
```

### findNotifications

This provides a way of finding all the notifications by their text, image, or title and removing, clicking, or closing all in one go.

Setting any of the selectors to undefined allows any value. That's why `findNotifications({})` returns all notifications.

```ts
type FindNotifications = (selectors: {
	text?: string;
	image?: string;
	title?: string;
}) => {
	remove: () => void; // Remove notifications that match the selectors
	click: () => void; // Click notifications that match the selectors
	close: () => void; // Close notifications that match the selectors
	count: () => number; // Get count of notifications that match the selectors
};
```

### setNotificationCompat

This allows you to have `GM_notification` / `GM.notification` behave like with Firefox / Chromium. See more about the differences [here](https://github.com/melusc/mock-violentmonkey/blob/main/src/vm-functions/notifications-notes.md)

```ts
type SetNotificationCompat = (platform: 'Firefox' | 'Chromium') => void;
```

### getClipboard

This allows you to get the current clipboard value for the current context.

```ts
type GetClipbard = () => {data: string; type: string} | undefined;
```

### getTabs

This allows you to see all open tabs and close them or see the resolved options.

If url is undefined, it returns all tabs.

```ts
type GetTabs = (url?: string | RegExp) => Tab[];

type Tab = {
	close: () => void;
	url: string;
	options: {
		active: boolean;
		container: number;
		insert: boolean;
		pinned: boolean;
	};
};
```

### enableDomGlobal

Instead of polluting the global namespace, this allows you to only enable whatever is required.
Only `document` and `window` are added to the global namespace by default.

This is, however, not aware of violentmonkey-contexts, so calling it once at the start of the file is enough.

```js
console.log(typeof FormData); // undefined
enableDomGlobal('FormData');
console.log(typeof FormData); // function
```

## License

MIT
