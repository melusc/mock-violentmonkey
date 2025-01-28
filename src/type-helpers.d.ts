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

// No support for tuples
export type PartialDeep<T extends Record<string, unknown>> = {
	[Key in keyof T]?: IsPrimitive<T[Key]> extends true
		? T[Key]
		: T[Key] extends Array<infer V>
			? Array<PartialDeep<V>>
			: T[Key] extends ReadonlyArray<infer V>
				? ReadonlyArray<PartialDeep<V>>
				: T[Key] extends Record<string, unknown>
					? PartialDeep<T[Key]>
					: never;
};
