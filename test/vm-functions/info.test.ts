import test from 'ava';

import {
	GM_info,
	update_GM_info,
	violentMonkeyContext,
	type ScriptInfo,
} from '../../src/index.js';

test(
	'GM_info should return a valid object',
	violentMonkeyContext(t => {
		const info = GM_info();

		t.is(typeof info.uuid, 'string');
		t.is(typeof info.scriptMetaStr, 'string');
		t.is(typeof info.scriptWillUpdate, 'boolean');
		t.is(info.scriptHandler, 'Violentmonkey');
		t.is(typeof info.version, 'string');

		t.is(typeof info.platform.arch, 'string');
		t.is(typeof info.platform.browserName, 'string');
		t.is(typeof info.platform.browserVersion, 'string');
		t.is(typeof info.platform.os, 'string');

		t.is(typeof info.script.antifeature, 'undefined');
		t.is(typeof info.script.author, 'undefined');
		t.is(typeof info.script.description, 'string');
		t.deepEqual(info.script.excludeMatches, []);
		t.deepEqual(info.script.excludes, []);
		t.deepEqual(info.script.grant, []);
		t.deepEqual(info.script.includes, []);
		t.deepEqual(info.script.matches, []);
		t.is(typeof info.script.name, 'string');
		t.is(typeof info.script.namespace, 'string');
		t.deepEqual(info.script.resources, []);
		t.deepEqual(info.script.require, []);
		t.is(typeof info.script.runAt, 'string');
		t.is(typeof info.script.version, 'string');

		t.is(typeof info.injectInto, 'string');
		t.is(typeof info.isIncognito, 'boolean');
		t.is(typeof info.userAgent, 'string');
	}),
);

test(
	'update_GM_info should handle flat objects',
	violentMonkeyContext(t => {
		const original = {...GM_info()};

		const changedValues: Partial<ScriptInfo> = {
			version: '1.2.3',
			scriptHandler: 'Tampermonkey',
			scriptWillUpdate: false,
		};

		update_GM_info(changedValues);

		t.deepEqual(GM_info(), {...original, ...changedValues});
	}),
);

test(
	'update_GM_info should handle #script',
	violentMonkeyContext(t => {
		update_GM_info({
			script: {
				resources: [
					{
						url: 'url1',
						name: 'name1',
					},
				],
				excludes: ['excludes1'],
				includes: ['includes1'],
				matches: ['matches1'],
			},
		});

		const script1 = GM_info().script;
		t.deepEqual(script1.excludes, ['excludes1']);
		t.deepEqual(script1.includes, ['includes1']);
		t.deepEqual(script1.matches, ['matches1']);
		t.deepEqual(script1.resources, [
			{
				url: 'url1',
				name: 'name1',
			},
		]);

		const changedValues: {
			script: Pick<
				ScriptInfo['script'],
				| 'resources'
				| 'excludes'
				| 'includes'
				| 'matches'
				| 'description'
				| 'version'
			>;
		} = {
			script: {
				resources: [
					{
						url: 'url2',
						name: 'name2',
					},
					{
						url: 'url3',
						name: 'name3',
					},
				],
				excludes: ['excludes2'],
				includes: ['includes2'],
				matches: ['matches2'],

				description: 'An in-depth description',
				version: '1.2.3',
			},
		};

		update_GM_info(changedValues);

		const script2 = GM_info().script;

		t.is(script2.description, changedValues.script.description);
		t.is(script2.version, changedValues.script.version);

		t.deepEqual(script2.excludes, changedValues.script.excludes);
		t.deepEqual(script2.matches, changedValues.script.matches);
		t.deepEqual(script2.includes, changedValues.script.includes);
		t.deepEqual(script2.resources, changedValues.script.resources);
	}),
);
