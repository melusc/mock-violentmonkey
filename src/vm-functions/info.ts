import crypto from 'node:crypto';
import process from 'node:process';

import type {PartialDeep} from '../type-helpers.js';
import {VMStorage} from '../vm-storage.js';

type ScriptInfo = {
	/** A unique ID of the script. */
	uuid: string;

	/** The meta block of the script. */
	scriptMetaStr: string;

	/** Whether the script will be updated automatically. */
	scriptWillUpdate: boolean;

	/** The name of userscript manager, which should be the string Violentmonkey. */
	scriptHandler: string;

	/** Version of Violentmonkey. */
	version: string;

	/** Unlike navigator.userAgent, which can be overriden by other extensions/userscripts or by devtools in device-emulation mode, GM_info.platform is more reliable as the data is obtained in the background page of Violentmonkey using a specialized extension API (browser.runtime.getPlatformInfo and getBrowserInfo). */
	platform: {
		/** One of "arm", "mips", "mips64", "x86-32", "x86-64". */
		arch: string;

		/** "chrome", "firefox" or whatever was returned by the API. */
		browserName: string;

		browserVersion: string;

		/** One of "android", "cros", "linux", "mac", "openbsd", "win". */
		os: string;
	};

	/** Contains structured fields from the Metadata Block: */
	script: {
		antifeature?: string[];
		author?: string;
		compatible?: string[];
		connect?: string[];
		description: string;
		downloadURL?: string;
		excludeMatches: string[];
		excludes: string[];
		grant: string[];
		/** @deprecated */
		homepage?: string;
		homepageURL?: string;
		icon?: string;
		includes: string[];
		matches: string[];
		name: string;
		namespace: string;
		noframes?: boolean;
		require: string[];
		resources: Array<{
			name: string;
			url: string;
		}>;
		runAt:
			| ''
			| 'document-start'
			| 'document-body'
			| 'document-end'
			| 'document-idle';
		supportURL?: string;
		unwrap?: boolean;
		updateURL?: string;
		version: string;
	};

	/** The injection mode of current script */
	injectInto: 'page' | 'content';

	/** True when this is an incognito profile (Chrome) or private mode (Firefox). */
	isIncognito: boolean;

	/** A safe copy of navigator.userAgent from the content script of the extension,
	 * so it cannot be overridden by other extensions/userscripts. */
	userAgent: string;
};

const generateInfo = (): ScriptInfo => ({
	uuid: crypto.randomUUID(),
	scriptMetaStr: '',
	scriptWillUpdate: true,
	scriptHandler: 'Violentmonkey',
	version: '2.30.0',
	platform: {
		arch: 'x86-64',
		browserName: 'firefox',
		browserVersion: '135.0',
		os: 'linux',
	},
	script: {
		description: '',
		excludeMatches: [],
		excludes: [],
		grant: [],
		includes: [],
		matches: [],
		name: '',
		namespace: '',
		resources: [],
		require: [],
		runAt: 'document-start',
		version: '1.0',
	},
	injectInto: 'page',
	isIncognito: false,
	userAgent: `mock-violentmonkey (Node.js ${process.version})`,
});

const cachedInfos = new VMStorage<ScriptInfo>(generateInfo);

/**
 * Returns with information about the userscript
 *
 * The object is modifiable like with Violentmonkey
 *
 * If this function is imported, it is a function, if it used from global, it is a getter.
 *
 * @defaultValue
 * ```
 * {
 * 	uuid: {randomly generated},
 * 	scriptMetaStr: '',
 * 	scriptWillUpdate: true,
 * 	scriptHandler: 'Violentmonkey',
 * 	version: '2.13.0',
 * 	platform: {
 * 		arch: 'x86-64',
 * 		browserName: 'firefox',
 * 		browserVersion: '93',
 * 		os: 'linux',
 * 	},
 * 	script: {
 * 		description: '',
 * 		excludes: [],
 * 		includes: [],
 * 		matches: [],
 * 		name: '',
 * 		namespace: '',
 * 		resources: [],
 * 		runAt: 'document-start',
 * 		version: '1.0',
 * 	},
 * 	injectInto: 'page',
 * }
 * ```
 */
const getInfo = () => cachedInfos.get(true);

/* #resources may be undefined
	But not #url or #name in resources
*/
type PartialScriptInfo = PartialDeep<ScriptInfo>;

/**
 * Update the GM_info object by passing a DeepPartial of GM_info
 */
const updateInfo = (newInfo: PartialScriptInfo) => {
	const info = getInfo();

	for (const [key, value] of Object.entries(newInfo)) {
		switch (key) {
			case 'script':
			case 'platform': {
				Object.assign(info[key], value);

				break;
			}

			default: {
				// @ts-expect-error It will always have the right type, since key and value are connected
				info[key] = value;
			}
		}
	}

	return info;
};

export {
	getInfo as GM_info,
	updateInfo as update_GM_info,
	type ScriptInfo,
	type PartialScriptInfo,
};

Object.defineProperties(globalThis, {
	GM_info: {
		get: getInfo,
	},
});
