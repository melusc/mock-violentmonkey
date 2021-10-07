import test from 'ava';

import {BetterMap} from '../../src/utils';

test('BetterMap should work like a regular map', t => {
	const map = new Map<string, number>();
	const bMap = new BetterMap<string, number>();

	t.false(map.has('f'));
	t.false(bMap.has('f'));

	map.set('f', 0);
	bMap.set('f', 0);

	t.is(map.get('f'), 0);
	t.is(bMap.get('f'), 0);
	t.true(map.has('f'));
	t.true(bMap.has('f'));
});

test('BetterMap should return and set the default value', t => {
	const map = new BetterMap<string, number>();

	t.false(map.has('f'));

	t.is(map.get('f'), undefined);
	t.is(map.get('f', () => 1), 1);
	t.is(map.get('f'), 1);

	t.true(map.has('f'));
});
