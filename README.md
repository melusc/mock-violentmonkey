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

## GM-api

Currently supports `GM_setValue`, `GM_getValue`, `GM_deleteValue`, `GM_listValues`, `GM_info`, `GM_addStyle`, `GM_getResourceText`, `GM_getResourceURL`, `GM.setValue`, `GM.getValue`, `GM.deleteValue`, `GM.listValues`, `GM.addStyle`, `GM.getResourceURL`, and `GM.info`. More info on the [official Violentmonkey api](https://violentmonkey.github.io/api/gm/). See [here](https://github.com/melusc/mock-violentmonkey/blob/87f7a7a01b5079e433cbd7dc11ed36f738878aa7/src/vm-functions/info.ts#L55-L79) for the default GM_info values.

All functions are globals so that the userscript has access to them.
For Typescript it is best if you import them, though, because Typescript doesn't know they're globals or you can tell Typescript like [this](https://github.com/melusc/mock-violentmonkey/blob/c553036881a42fb8d2b621eb054062086b5a334e/test/vm-functions/globals.test.ts#L19-L25).

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

## Additional GM-api

Additionally, mock-violentmonkey has some helper functions for setting up tests more easily.

### update_GM_info

This provides an easy way of updating `GM_info`. `GM_info` is mutable and `update_GM_info` provides an easy way of updating it in one go.

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

## License

MIT
