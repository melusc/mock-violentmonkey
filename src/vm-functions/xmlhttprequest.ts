import {Blob, Buffer} from 'node:buffer';
import crypto from 'node:crypto';

import {JSDOM} from 'jsdom';
import type {JsonValue} from 'type-fest';

import {getBaseUrl} from '../base-url.js';
import {getWindow} from '../dom.js';
import {
	XMLHttpRequest,
	type Events,
	type Headers,
	type Method,
} from '../xmlhttprequest/index.js';

type XHRResponseObject<TContext = any> = {
	status: number;
	statusText: string;
	readyState: number;
	responseHeaders: string;
	// eslint-disable-next-line @typescript-eslint/ban-types
	response: string | Blob | ArrayBuffer | Document | JsonValue | null;
	responseText: string | undefined;
	finalUrl: string;
	context: TContext;
};

type XHREventHandler<TContext = any> = (
	responseObject: XHRResponseObject<TContext>,
) => void;

type XHRDetails<TContext = any> = {
	/** URL relative to current page is also allowed. */
	url: string;

	// https://www.typescriptlang.org/tsconfig#exactOptionalPropertyTypes
	/** Usually GET. */
	method?: Method | undefined;
	/** User for authentication. */
	user?: string | undefined;
	/** Password for authentication. */
	password?: string | undefined;
	/** A MIME type to specify with the request. */
	overrideMimeType?: string | undefined;
	headers?: Headers | undefined;
	/** Defaults to 'text'. */
	responseType?:
		| 'text'
		| 'json'
		| 'blob'
		| 'arraybuffer'
		| 'document'
		| undefined;
	/** Time to wait for the request, none by default. */
	timeout?: number | undefined;
	/** Data to send with the request, usually for POST and PUT requests. */
	data?: string | FormData | Blob;
	/** Send the data string as a blob. This is for compatibility with Tampermonkey/Greasemonkey, where only string type is allowed in data */
	binary?: boolean | undefined;
	/** Can be an object and will be assigned to context of the response object. */
	context?: TContext;
	/** When set to true, no cookie will be sent with the request and since VM2.12.5 the response cookies will be ignored. The default value is false. */
	anonymous?: boolean | undefined;

	// Event handlers

	onabort?: XHREventHandler<TContext> | undefined;
	onerror?: XHREventHandler<TContext> | undefined;
	onload?: XHREventHandler<TContext> | undefined;
	onloadend?: XHREventHandler<TContext> | undefined;
	onloadstart?: XHREventHandler<TContext> | undefined;
	onprogress?: XHREventHandler<TContext> | undefined;
	onreadystatechange?: XHREventHandler<TContext> | undefined;
	ontimeout?: XHREventHandler<TContext> | undefined;
};

type XmlHttpRequest = <TContext>(details: XHRDetails<TContext>) => {
	abort: () => void;
};

const formDataToBuffer = async (
	data: FormData,
): Promise<{
	content: Buffer;
	contentType: string;
}> => {
	const boundary = '-'.repeat(20) + crypto.randomBytes(20).toString('hex');

	const body: string[] = [];
	for (const [key, value] of data) {
		body.push(
			`--${boundary}`,
			`Content-Disposition: form-data; name=${JSON.stringify(key)}`,
		);

		if (typeof value === 'string') {
			// Two CRLF
			body.push('', value);
		} else {
			// eslint-disable-next-line no-await-in-loop
			await new Promise<void>((resolve, reject) => {
				const fr = new (getWindow().FileReader)();
				fr.addEventListener('load', () => {
					const result = fr.result as string;

					body[body.length - 1] += `; filename=${JSON.stringify(value.name)}`;

					// Two CRLF before result
					body.push(
						`Content-Type: ${value.type || 'application/octet-stream'}`,
						'',
						result,
					);

					resolve();
				});

				fr.addEventListener('error', () => {
					reject(fr.error);
				});

				fr.readAsText(value);
			});
		}
	}

	// Trailing CRLF
	body.push(`--${boundary}--`, '');

	const contentType = `multipart/form-data; boundary=${boundary}`;

	return {
		content: Buffer.from(body.join('\r\n')),
		contentType,
	};
};

const dataToBuffer = async (
	data: XHRDetails['data'],
): Promise<{
	content: Buffer | undefined;
	contentType: string | undefined;
}> => {
	if (data === undefined) {
		return {
			content: undefined,
			contentType: undefined,
		};
	}

	if (typeof data === 'string') {
		return {
			content: Buffer.from(data),
			contentType: 'text/plain;charset=UTF-8',
		};
	}

	if (
		data instanceof getWindow().FormData
		|| (typeof FormData !== 'undefined' && data instanceof FormData)
	) {
		return formDataToBuffer(data);
	}

	if (data instanceof Blob) {
		return {
			content: Buffer.from(await data.arrayBuffer()),
			contentType: data.type || undefined,
		};
	}

	return dataToBuffer(String(data));
};

const responseToResponseType = (
	xhr: XMLHttpRequest,
	responseType: XHRDetails['responseType'],
): XHRResponseObject['response'] | SyntaxError => {
	responseType = String(
		responseType,
	).toLowerCase() as XHRDetails['responseType'];

	const buffer = xhr.responseBuffer;

	switch (String(responseType).toLowerCase() as XHRDetails['responseType']) {
		case 'arraybuffer': {
			const arrayBuffer = new ArrayBuffer(buffer.byteLength);
			const view = new Uint8Array(arrayBuffer);

			for (const [i, value] of buffer.entries()) {
				view[i] = value;
			}

			return arrayBuffer;
		}

		case 'json': {
			try {
				return JSON.parse(buffer.toString()) as JsonValue;
			} catch (error: unknown) {
				return error as SyntaxError;
			}
		}

		case 'blob': {
			return new Blob([buffer], {
				type: xhr.getResponseHeader('content-type') as string,
			});
		}

		case 'document': {
			return new JSDOM(buffer.toString(), {
				url: xhr.responseURL,
			}).window.document;
		}

		default: {
			return buffer.toString();
		}
	}
};

const makeEventResponse = <TContext = never>(
	xhr: XMLHttpRequest,
	details: XHRDetails<TContext>,
): XHRResponseObject<TContext> => {
	// Caching this one is necessary because otherwise
	// `responseObject.response === responseObject.response` returns `false`
	// if they are some form of object
	let response: XHRResponseObject['response'] | Error | undefined;

	// Caching this one is optional, since comparing two equal strings returns `true`
	let responseText: string | undefined;

	return Object.defineProperties(
		{
			status: xhr.status,
			statusText: xhr.statusText,
			readyState: xhr.readyState,
			responseHeaders: xhr.getAllResponseHeaders(),
			finalUrl: xhr.responseURL,
			context: details.context,
		},
		{
			response: {
				get() {
					response ??= responseToResponseType(xhr, details.responseType);
					return response;
				},
			},
			responseText: {
				get() {
					responseText ??= xhr.responseBuffer.toString();
					return responseText;
				},
			},
		},
	) as XHRResponseObject<TContext>;
};

const xmlhttpRequest: XmlHttpRequest = <TContext>(
	details: Readonly<XHRDetails<TContext>>,
) => {
	let aborted = false;

	void dataToBuffer(details.data).then(({content, contentType}) => {
		const xhr = new XMLHttpRequest({
			base: getBaseUrl(),
		});

		aborter.abort = () => {
			xhr.abort();
		};

		if (typeof details.timeout === 'number') {
			xhr.timeout = details.timeout;
		}

		const events: readonly Events[] = [
			'abort',
			'error',
			'load',
			'loadend',
			'loadstart',
			'progress',
			'readystatechange',
			'timeout',
		];

		for (const event of events) {
			xhr.addEventListener(event, () => {
				const cb = details[`on${event}`];
				if (typeof cb === 'function') {
					cb(makeEventResponse(xhr, details));
				}
			});
		}

		xhr.open(
			details.method ?? 'get',
			details.url,
			details.user,
			details.password,
		);

		if (details.headers) {
			for (const [key, value] of Object.entries(details.headers)) {
				xhr.setRequestHeader(key, value);
			}
		}

		if (contentType !== undefined && !xhr.getRequestHeader('content-type')) {
			xhr.setRequestHeader('content-type', contentType);
		}

		xhr.send(content);

		// Doing it like this makes sure that
		// it behaves just like asynchronous abort
		if (aborted) {
			xhr.abort();
		}
	});

	// Once xhr exists switch this out
	// This is necessary because turning the data to a buffer
	// is asynchronous but GM_xmlhttpRequest not
	const aborter = {
		abort() {
			aborted = true;
		},
	};

	return aborter;
};

export type {Headers} from '../xmlhttprequest/index.js';
export {
	type XHRDetails,
	type XHREventHandler,
	type XHRResponseObject,
	type XmlHttpRequest,
	xmlhttpRequest as GM_xmlhttpRequest,
};

Object.defineProperties(global, {
	GM_xmlhttpRequest: {
		value: xmlhttpRequest,
	},
	Blob: {
		value: Blob,
	},
});
