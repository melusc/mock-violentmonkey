import crypto from 'node:crypto';

import {PartialDeep, Entries} from 'type-fest';

import {BetterMap} from '../utils';
import {getStore} from '../violentmonkey-context';

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
		description: string;
		excludes: string[];
		includes: string[];
		matches: string[];
		name: string;
		namespace: string;
		resources: Array<{name: string; url: string}>;
		runAt: string;
		version: string;
	};

	/** The injection mode of current script */
	injectInto: 'page' | 'content';
};

const generateInfo = (): ScriptInfo => ({
	uuid: crypto.randomUUID(),
	scriptMetaStr: '',
	scriptWillUpdate: true,
	scriptHandler: 'Violentmonkey',
	version: '2.13.0',
	platform: {
		arch: 'x86-64',
		browserName: 'firefox',
		browserVersion: '93',
		os: 'linux',
	},
	script: {
		description: '',
		excludes: [],
		includes: [],
		matches: [],
		name: '',
		namespace: '',
		resources: [],
		runAt: 'document-start',
		version: '1.0',
	},
	injectInto: 'page',
});

const cachedInfos = new BetterMap<number, ScriptInfo>();

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
const getInfo = () => cachedInfos.get(getStore(), () => generateInfo());

/* #resources may be undefined
	But not #url or #name in resources
*/
type PartialScriptInfo = PartialDeep<ScriptInfo> & {
	script?: {
		resources?: ScriptInfo['script']['resources'];
	};
};

type NonOptional<T> = T extends undefined ? never : T;
type PartialScriptInfo_Script = NonOptional<PartialScriptInfo['script']>;

/**
 * Update GM_info#script by passing a DeepPartial of GM_info#script
 */
const updateInfoScript = (newScript: PartialScriptInfo_Script) => {
	const {script} = getInfo();

	for (const [key, value] of Object.entries(
		newScript,
	) as Entries<PartialScriptInfo_Script>) {
		switch (key) {
			case 'excludes':
			case 'includes':
			case 'matches':
			case 'resources': {
				// @ts-expect-error It will always have the right type, since key and value are connected
				script[key].push(...value);

				break;
			}

			default: {
				// @ts-expect-error It will always have the right type, since key and value are connected
				script[key] = value;
			}
		}
	}
};

/**
 * Update the GM_info object by passing a DeepPartial of GM_info
 */
const updateInfo = (newInfo: PartialScriptInfo) => {
	const info = getInfo();

	for (const [key, value] of Object.entries(newInfo) as Entries<ScriptInfo>) {
		switch (key) {
			case 'script': {
				updateInfoScript(value as PartialScriptInfo_Script);

				break;
			}

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
	ScriptInfo,
	PartialScriptInfo,
};

Object.defineProperties(global, {
	GM_info: {
		get: getInfo,
	},
});
