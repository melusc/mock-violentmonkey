export type JsonValue =
	| number
	| null
	| string
	| boolean
	| JsonObject
	| JsonArray;

export type JsonArray = readonly JsonValue[];
export type JsonObject = {
	[key: string]: JsonValue;
};

type IsPrimitive<T> = T extends number | boolean | string | null | undefined
	? true
	: false;

// Separate or readability
// Cannot handle unions, must receive a single type
type PartialDeepUnionValues<T> =
	IsPrimitive<T> extends true
		? T
		: T extends Array<infer V>
			? Array<PartialDeep<V>>
			: T extends ReadonlyArray<infer V>
				? ReadonlyArray<PartialDeep<V>>
				: T extends Record<string, unknown>
					? PartialDeep<T>
					: never;

// No support for tuples
export type PartialDeep<T> = {
	// If T[Key] is a union or optional with `?:`
	// It is necessary to handle each value individually
	// This is one way of doing that
	// With `extends` TS runs it seperately for each union item
	[Key in keyof T]?: T[Key] extends infer V1
		? PartialDeepUnionValues<V1>
		: never;
};
