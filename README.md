# mock-violentmonkey

[![NPM](https://img.shields.io/npm/v/mock-violentmonkey.svg?style=flat)](https://npmjs.org/package/mock-violentmonkey)
[![License](https://img.shields.io/npm/l/mock-violentmonkey.svg?style=flat)](https://github.com/melusc/mock-violentmonkey)
[![Dependencies](https://img.shields.io/david/melusc/mock-violentmonkey)](https://github.com/melusc/mock-violentmonkey)

mock-violentmonkey allows you to mock Violentmonkey's api for testing Violentmonkey userscripts.
mock-violentmonkey allows you to have seperated contexts for testing different scenarious without them interfering with each other.

## Disclaimer

I've stopped active development on this library.
I'll continue to provide updates for dependencies and address any bugs that pop up.
As for features, I consider the library complete. If you think there's something crucial missing, please open an issue to discuss potential additions.

## API

### violentMonkeyContext

This the whole magic. violentMonkeyContext seperates the various testing contexts from each other. This allows you to use `GM_setValue` and the like and not worry about it affecting other tests.

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

| Function                                                                                               | Support | Notes                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [`GM_info` / `GM.info`](https://violentmonkey.github.io/api/gm/#gm_info)                               | ✔️      | [Default value](https://github.com/melusc/mock-violentmonkey/blob/e00f5460dba990decd1a37edd9329b53751a9b8e/src/vm-functions/info.ts#L55-L79) |
| [`GM_getValue` / `GM.getValue`](https://violentmonkey.github.io/api/gm/#gm_getvalue)                   | ✔️      |                                                                                                                                              |
| [`GM_setValue` / `GM.setValue`](https://violentmonkey.github.io/api/gm/#gm_setvalue)                   | ✔️      |                                                                                                                                              |
| [`GM_deleteValue` / `GM.deleteValue`](https://violentmonkey.github.io/api/gm/#gm_deletevalue)          | ✔️      |                                                                                                                                              |
| [`GM_listValues` / `GM.listValues`](https://violentmonkey.github.io/api/gm/#gm_listvalues)             | ✔️      |                                                                                                                                              |
| [`GM_addValueChangeListener`](https://violentmonkey.github.io/api/gm/#gm_addvaluechangelistener)       | ✔️      |                                                                                                                                              |
| [`GM_removeValueChangeListener`](https://violentmonkey.github.io/api/gm/#gm_removevaluechangelistener) | ✔️      |                                                                                                                                              |
| [`GM_getResourceText`](https://violentmonkey.github.io/api/gm/#gm_getresourcetext)                     | ✔️      |                                                                                                                                              |
| [`GM_getResourceURL` / `GM.getResourceURL`](https://violentmonkey.github.io/api/gm/#gm_getresourceurl) | ✔️      | This returns an object url, which cannot be fetched with regular http libs in node, use `GM_getResourceText` instead.                        |
| [`GM_addStyle` / `GM.addStyle`](https://violentmonkey.github.io/api/gm/#gm_addstyle)                   | ✔️      |                                                                                                                                              |
| [`GM_openInTab` / `GM.openInTab`](https://violentmonkey.github.io/api/gm/#gm_openintab)                | ✔️      |                                                                                                                                              |
| [`GM_registerMenuCommand`](https://violentmonkey.github.io/api/gm/#gm_registermenucommand)             | ✔️      |                                                                                                                                              |
| [`GM_unregisterMenuCommand`](https://violentmonkey.github.io/api/gm/#gm_unregistermenucommand)         | ✔️      |                                                                                                                                              |
| [`GM_notification` / `GM.notification`](https://violentmonkey.github.io/api/gm/#gm_notification)       | ✔️      |                                                                                                                                              |
| [`GM_setClipboard` / `GM.setClipboard`](https://violentmonkey.github.io/api/gm/#gm_setclipboard)       | ✔️      | This doesn't actually set the clipboard.                                                                                                     |
| [`GM_xmlhttpRequest` / `GM.xmlHttpRequest`](https://violentmonkey.github.io/api/gm/#gm_xmlhttprequest) | ✔️      | Can be used in combination with [setBaseUrl](#setbaseurl)                                                                                    |
| [`GM_download`](https://violentmonkey.github.io/api/gm/#gm_download)                                   | ✔️      | Can be used in combination with [setBaseUrl](#setbaseurl)                                                                                    |

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

This should always be used for `FormData`,
because node's implementation of `FormData` does not work with jsdom's `File`.

This is not aware of violentmonkey-contexts, so calling it once at the start of the file is enough.

```js
console.log(typeof FormData); // undefined
enableDomGlobal('FormData');
console.log(typeof FormData); // function
```

### setBaseUrl

If your code should behave differently depending on the location, you can set the location with `setBaseUrl`.
If not called, it defaults to `http://localhost:5000/`. This is also used for relative urls.

This should run before calling `GM_xmlhttpRequest`,
`getWindow` or other functions reliant on jsdom,
ideally at the beginning of the vm context.

```js
test(
  'setBaseUrl before',
  violentMonkeyContext(t => {
    setBaseUrl('https://google.com/');

    console.log(getWindow().location.href); // https://google.com/
  }),
);

test(
  'setBaseUrl after',
  violentMonkeyContext(t => {
    // Initialise the window.
    getWindow();

    // The window is already initialised, changing the baseUrl doesn't do anything
    setBaseUrl('https://google.com/');

    console.log(getWindow().location.href); // http:localhost:5000/
  }),
);
```

### getDownloads

Instead of actually saving files to the disk, [`GM_download`](https://violentmonkey.github.io/api/gm/#gm_download) saves them to memory as a buffer and `getDownloads` provides a way of gaining access to them.

```ts
type GetDownloads = () => Record<string, Buffer>;
```

```js
test(
  'title',
  violentMonkeyContext(t => {
    // No downloads yet
    // Returns empty object
    console.log(getDownloads());

    GM_download({
      url: 'https://example.com/',
      name: 'example-com.html',
      onload: () => {
        console.log(getDownloads());
        // {
        //   "example-com.html": <Buffer 3c 21 ...>
        // }
      },
    });
  }),
);
```

### getDownload

This is similar to [`getDownloads`](#getdownloads) but it only returns the corresponding buffer of the passed filename.

```ts
type GetDownload = (name: string) => Buffer | undefined;
```

```js
test(
  'title',
  violentMonkeyContext(t => {
    console.log(getDownload('example-com.html')); // undefined

    GM_download({
      url: 'https://example.com/',
      name: 'example-com.html',
      onload: () => {
        console.log(getDownload('example-com.html'));
        // <Buffer 3c 21 ...>
      },
    });
  }),
);
```

## License

MIT (c) Luca Schnellmann, 2025
