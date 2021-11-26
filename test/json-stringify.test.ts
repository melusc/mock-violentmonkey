/* eslint-disable @typescript-eslint/no-empty-function */

import test from 'ava';

import {jsonStringify} from '../src/json-stringify.js';

test('jsonStringify should handle null', t => {
	t.is(jsonStringify(null), 'null');
});

test('jsonStringify should handle undefined', t => {
	t.is(jsonStringify(undefined), 'null');
});

test('jsonStringify should handle strings', t => {
	t.is(jsonStringify(''), '""');
	t.is(jsonStringify('perfectly normal string'), '"perfectly normal string"');
	t.is(jsonStringify('\\'), '"\\\\"');
	t.is(jsonStringify('\b\f\n\r\t'), '"\\b\\f\\n\\r\\t"');
	t.is(jsonStringify('"'), '"\\""');
	t.is(jsonStringify('\u0001\u2028\u2029'), '"\\u0001\\u2028\\u2029"');
});

test('jsonStringify should handle numbers', t => {
	t.is(jsonStringify(0), '0');
	t.is(jsonStringify(-10), '-10');
	t.is(jsonStringify(Number.MAX_SAFE_INTEGER), '9007199254740991');
	t.is(jsonStringify(0.2), '0.2');
	t.is(jsonStringify(2e64), '2e+64');

	t.is(jsonStringify(Number.NEGATIVE_INFINITY), 'null');
	t.is(jsonStringify(Number.POSITIVE_INFINITY), 'null');
	t.is(jsonStringify(Number.NaN), 'null');
});

test('jsonStringify should handle booleans', t => {
	t.is(jsonStringify(true), 'true');
	t.is(jsonStringify(false), 'false');
});

test('jsonStringify should handle flat arrays', t => {
	t.is(jsonStringify([1, 2, 3, 4]), '[1,2,3,4]');
	t.is(jsonStringify([true, false, true]), '[true,false,true]');
	t.is(jsonStringify(['a', 'b', 'c']), '["a","b","c"]');

	/** Even though accessing any of the first few elements returns undefined
	 * jsonStringify uses Array#map and that just ignores empty (but not undefined) cells.
	 * As such the empty cells don't get turned into "null" and only the `1` gets turned into "1"
	 *
	 * Array#join turns undefined and null into ''
	 */
	/* eslint-disable-next-line no-sparse-arrays */
	t.is(jsonStringify([, , , , , , 1]), '[,,,,,,1]');
});

test('jsonStringify should handle flat objects', t => {
	t.is(
		jsonStringify({
			str: 's',
			bool: true,
			num: 42,
			nan: Number.POSITIVE_INFINITY,
			[Symbol.for('symbol')]: 'symbol', // It ignores this (as does violentmonkey)
		}),
		'{"str":"s","bool":true,"num":42,"nan":null}',
	);
});

test('jsonStringify should handle nested arrays', t => {
	t.is(
		jsonStringify([
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
		]),
		'[[0,1,2],[3,4,5],[6,7,8]]',
	);

	t.is(jsonStringify([{a: '1', b: [1, 2, 3]}]), '[{"a":"1","b":[1,2,3]}]');

	t.is(
		jsonStringify({
			1: {
				2: {
					3: {
						4: {
							5: {
								hello: 'world!',
							},
						},
					},
				},
			},
		}),
		'{"1":{"2":{"3":{"4":{"5":{"hello":"world!"}}}}}}',
	);
});

test('jsonStringify should throw on cyclic objects', t => {
	// Violentmonkey also throws

	t.throws(() => {
		const object: Record<string, any> = {};
		object['cyclic'] = object;

		jsonStringify(object);
	});

	t.throws(() => {
		const array: any[] = [];
		array[0] = array;

		jsonStringify(array);
	});

	t.throws(() => {
		const array: any[] = [];
		array[0] = {
			mixed: array,
		};

		jsonStringify(array);
	});

	t.notThrows(() => {
		type array_ = Array<number | array_>;

		const array: array_ = [1, 2];
		array[2] = [...array];

		t.is(jsonStringify(array), '[1,2,[1,2]]');
	});
});

test('jsonStringify should handle non-primitives', t => {
	t.is(jsonStringify(new Map()), '"[object Map]"');
	t.is(jsonStringify(new Set()), '"[object Set]"');
	t.is(jsonStringify(/hello/), '"/hello/"');
	t.is(
		jsonStringify(() => {}),
		`"${(() => {}).toString()}"`,
	);
	t.is(
		jsonStringify(function * () {}),
		`"${function * () {}.toString()}"`,
	);
});
