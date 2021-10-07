/* Shamelessly stolen from
 * https://github.com/violentmonkey/violentmonkey/blob/4865a5ce6f9c1702d0be51d07045881fe98635a5/src/injected/utils/helpers.js#L32-L68
 * (Violentmonkey uses MIT license)
 */

/* Reference: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON#Polyfill */
const escMap: Record<string, string> = {
	'"': '\\"',
	'\\': '\\\\',
	'\b': '\\b',
	'\f': '\\f',
	'\n': '\\n',
	'\r': '\\r',
	'\t': '\\t',
};

/* eslint-disable-next-line no-control-regex */
const escRE = /[\\"\u0000-\u001F\u2028\u2029]/g;
const escFunc = (m: string) =>
	escMap[m] ?? `\\u${m.charCodeAt(0).toString(16).padStart(4, '0')}`;

const jsonStringify = (value: unknown): string => {
	/* We're not testing for cyclic object values
	 * since violentmonkey doesn't either
	 * That's why we just let it throw from too much recursion
	 */

	if (value === null || value === undefined) {
		return 'null';
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) ? `${value}` : 'null';
	}

	if (typeof value === 'boolean') {
		/* eslint-disable-next-line @typescript-eslint/restrict-template-expressions */
		return `${value}`;
	}

	if (typeof value === 'object') {
		if (Array.isArray(value)) {
			return `[${value.map(item => jsonStringify(item)).join(',')}]`;
		}

		if (Object.prototype.toString.call(value) === '[object Object]') {
			const value_ = value as Record<string | symbol, unknown>;
			const result = Object.keys(value_).map(key => {
				const v = value_[key];
				return v !== undefined && `${jsonStringify(key)}:${jsonStringify(v)}`;
			});
			return `{${result.filter(item => item !== false).join(',')}}`;
		}
	}

	/* String.prototype.replace converts value to a string */
	const escapedString = String.prototype.replace.call(value, escRE, escFunc);
	return `"${escapedString}"`;
};

export {jsonStringify};
