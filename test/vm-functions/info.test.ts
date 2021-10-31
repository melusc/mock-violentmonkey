import test from 'ava';
import {
	GM_info,
	violentMonkeyContext,
	update_GM_info,
	PartialScriptInfo,
	ScriptInfo,
} from '../../src';

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

		t.is(typeof info.script.description, 'string');
		t.deepEqual(info.script.excludes, []);
		t.deepEqual(info.script.includes, []);
		t.deepEqual(info.script.matches, []);
		t.is(typeof info.script.name, 'string');
		t.is(typeof info.script.namespace, 'string');
		t.deepEqual(info.script.resources, []);
		t.is(typeof info.script.runAt, 'string');
		t.is(typeof info.script.version, 'string');

		t.is(typeof info.injectInto, 'string');
	}),
);

test(
	'update_GM_info should handle flat objects',
	violentMonkeyContext(t => {
		const original = {...GM_info()};

		const changedValues: PartialScriptInfo = {
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
		// Make sure it doesn't overwrite these values
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

		const original = {...GM_info().script};
		const resources = original.resources.map(resource => ({...resource}));
		const excludes = [...original.excludes];
		const includes = [...original.includes];
		const matches = [...original.matches];

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

		const current = GM_info().script;

		t.is(current.description, changedValues.script.description);
		t.is(current.version, changedValues.script.version);

		t.deepEqual(current.excludes, [
			...excludes,
			...changedValues.script.excludes,
		]);
		t.deepEqual(current.matches, [...matches, ...changedValues.script.matches]);
		t.deepEqual(current.includes, [
			...includes,
			...changedValues.script.includes,
		]);
		t.deepEqual(current.resources, [
			...resources,
			...changedValues.script.resources,
		]);

		// It should still have the previous values
		t.true(current.includes.includes('includes1'));
		t.true(current.excludes.includes('excludes1'));
		t.true(current.matches.includes('matches1'));
		t.truthy(current.resources.find(resource => resource.name === 'name1'));
	}),
);
