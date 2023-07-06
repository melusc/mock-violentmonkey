/* eslint-disable @typescript-eslint/class-literal-property-style */

// Taken from https://github.com/mjwwit/node-XMLHttpRequest (MIT license) and heavily modified by me

/**
 * This is not meant to be completely spec compliant.
 * It is meant to be spec compliant where it matters for GM_xmlhttpRequest
 * For example abort before send behaves weirdly (even more so depending on the browser)
 * but luckily GM_xmlhttpRequest will never abort before send so it doesn't matter
 */

/**
 * Wrapper for built-in http.js to emulate the browser XMLHttpRequest object.
 *
 * @author Dan DeFelippi <dan@driverdan.com>
 * @author MeLusc <https://github.com/melusc>
 * @contributor David Ellis <d.f.ellis@ieee.org>
 * @license MIT
 */

import {Buffer, resolveObjectURL} from 'node:buffer';
import process from 'node:process';

import {dataUriToBuffer} from 'data-uri-to-buffer';
import followRedirects from 'follow-redirects';

const {http, https} = followRedirects;

const noop = () => {
	/* Nothing */
};

export type UppercaseMethods =
	| 'GET'
	| 'HEAD'
	| 'POST'
	| 'PUT'
	| 'DELETE'
	| 'OPTIONS';
export type Method = UppercaseMethods | Lowercase<UppercaseMethods>;
export type ReadyState = 0 | 1 | 2 | 3 | 4;
export type Options = {base?: string | URL | undefined};

type ResponseHandler = NonNullable<Parameters<typeof http.request>[2]>;
type Response = Parameters<ResponseHandler>[0];
type Request = ReturnType<typeof http.request>;

export type Events =
	| 'abort'
	| 'error'
	| 'load'
	| 'loadend'
	| 'loadstart'
	| 'progress'
	| 'readystatechange'
	| 'timeout';

export type Headers = Record<string, string | undefined>;

// Set some default headers
const defaultHeaders = {
	'User-Agent': 'node-XMLHttpRequest',
	Accept: '*/*',
};

// Only these headers should be forbidden
// (not xhr spec compliant, but GM_xmlhttpRequest allows them)
const forbiddenRequestHeaders = new Set([
	'accept-encoding',
	'content-transfer-encoding',
]);

// These request methods are not allowed
const allowedRequestMethods = new Set<UppercaseMethods>([
	'GET',
	'HEAD',
	'POST',
	'DELETE',
	'OPTIONS',
	'PUT',
]);

/**
 * Check if the specified header is allowed.
 *
 * @param header Header to validate
 * @return False if not allowed, otherwise true
 */
const isAllowedHttpHeader = (header: string): boolean =>
	typeof header === 'string'
	&& !forbiddenRequestHeaders.has(header.toLowerCase());

/**
 * Check if the specified method is allowed.
 *
 * @param method Request method to validate
 * @return False if not allowed, otherwise true
 */
const isAllowedHttpMethod = (method: UppercaseMethods): boolean =>
	typeof method === 'string' && allowedRequestMethods.has(method);

type XHRResponse = Pick<Response, 'headers'> & {
	destroy: () => void;
};

/**
 * `XMLHttpRequest` constructor.
 *
 * Supported options for the `opts` object are:
 *
 *  - `agent`: An http.Agent instance; http.globalAgent may be used; if 'undefined', agent usage is disabled
 *
 * @param {Object} opts optional "options" object
 */
class XMLHttpRequest {
	/**
	 * Constants
	 */
	static readonly UNSENT = 0;
	static readonly OPENED = 1;
	static readonly HEADERS_RECEIVED = 2;
	static readonly LOADING = 3;
	static readonly DONE = 4;
	readonly UNSENT = 0;
	readonly OPENED = 1;
	readonly HEADERS_RECEIVED = 2;
	readonly LOADING = 3;
	readonly DONE = 4;

	onabort: (() => void) | undefined;
	onerror: (() => void) | undefined;
	onload: (() => void) | undefined;
	onloadend: (() => void) | undefined;
	onloadstart: (() => void) | undefined;
	onprogress: (() => void) | undefined;
	onreadystatechange: (() => void) | undefined;
	ontimeout: (() => void) | undefined;

	// Current state
	readyState: ReadyState = this.UNSENT;

	// Result & response
	responseBuffer = Buffer.alloc(0);
	responseURL = '';
	status = 0;
	statusText = '';
	timeout = 0;

	// Request settings
	#settings:
		| {
				method: UppercaseMethods;
				url: string;
				user: string | undefined;
				password: string | undefined;
		  }
		| undefined;

	#options: Options;

	#response: XHRResponse | undefined;
	#request: Request | undefined;

	#headers: Record<string, string> = {...defaultHeaders};

	// Send flag
	#sendFlag = false;

	// Event listeners
	#listeners: Partial<Record<Events, Array<() => void>>> = {};

	// Error flag, used when errors occur or abort is called
	#errorFlag = false;
	#abortedFlag = false;
	#timeoutFlag = false;

	/**
	 * @param options Set the options for the request
	 */
	constructor(options: Options = {}) {
		this.#options = options;
	}

	/**
	 * Sets a header for the request.
	 *
	 * @param string header Header name
	 * @param string value Header value
	 * @return boolean Header added
	 */
	setRequestHeader = (header: string, value: Headers[string]) => {
		const headers = this.#headers;
		header = header.toLowerCase();

		if (this.readyState !== this.OPENED) {
			throw new Error(
				'INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN',
			);
		}

		if (!isAllowedHttpHeader(header)) {
			console.warn(`Attempt to set a forbidden header was denied: ${header}`);
			return false;
		}

		if (this.#sendFlag) {
			throw new Error('INVALID_STATE_ERR: send flag is true');
		}

		headers[header] = String(value);

		return true;
	};

	/**
	 * Open the connection. Currently supports local server requests.
	 *
	 * @param string method Connection method (eg GET, POST)
	 * @param string url URL for the connection.
	 * @param string user Username for basic authentication (optional)
	 * @param string password Password for basic authentication (optional)
	 */
	open = (method: Method, url: string, user?: string, password?: string) => {
		this.abort();
		this.#errorFlag = false;
		this.#abortedFlag = false;

		method = method.toUpperCase() as UppercaseMethods;

		// Check for valid request method
		if (!isAllowedHttpMethod(method)) {
			throw new Error(`SecurityError: Request method "${method}" not allowed`);
		}

		this.#settings = {
			method,
			url: String(url),
			user: user ?? undefined,
			password: password ?? undefined,
		};

		this.#setState(this.OPENED);
	};

	/**
	 * Gets a header from the server response.
	 *
	 * @param string header Name of header to get.
	 * @return string Text of the header or null if it doesn't exist.
	 */
	getResponseHeader = (header: string) => {
		const response = this.#response;

		if (
			typeof header === 'string'
			&& this.readyState > this.OPENED
			&& response?.headers[header.toLowerCase()]
		) {
			return response.headers[header.toLowerCase()];
		}

		return null;
	};

	/**
	 * Gets all the response headers.
	 *
	 * @return string A string with all response headers separated by CR+LF
	 */
	getAllResponseHeaders = () => {
		if (
			this.readyState < this.HEADERS_RECEIVED
			|| this.#errorFlag
			|| this.#response?.headers === undefined
		) {
			return '';
		}

		const result = [];

		for (const [key, value] of Object.entries(this.#response.headers)) {
			result.push(`${key}: ${value!.toString()}`);
		}

		return result.length === 0 ? '' : `${result.join('\r\n')}\r\n`;
	};

	/**
	 * Gets a request header
	 *
	 * @param string name Name of header to get
	 * @return string Returns the request header or empty string if not set
	 */
	getRequestHeader = (name: string) => {
		const headers = this.#headers;

		name = name.toLowerCase();
		return headers[name] ?? '';
	};

	/**
	 * Sends the request to the server.
	 *
	 * @param {unknown} data Optional data to send as request body.
	 */
	send = (data?: Buffer) => {
		if (this.readyState !== this.OPENED) {
			throw new Error(
				'INVALID_STATE_ERR: connection must be opened before send() is called',
			);
		}

		if (this.#sendFlag) {
			throw new Error('INVALID_STATE_ERR: send has already been called');
		}

		const settings = this.#settings!;

		let url: URL;
		try {
			url = new URL(settings.url, this.#options.base);
		} catch {
			this.#handleError();
			return;
		}

		// Here for historical reasons
		this.#dispatchEvent('readystatechange');

		this.responseURL = url.href;

		// Determine if valid protocol
		switch (url.protocol) {
			case 'data:': {
				this.#fetchDataURI(url);
				break;
			}

			case 'blob:': {
				this.#fetchBlob(url);
				break;
			}

			case 'https:':
			case 'http:': {
				this.#fetchHttp(url, data);
				break;
			}

			default: {
				this.#handleError();
			}
		}
	};

	/**
	 * Aborts a request.
	 */
	abort = () => {
		if (this.readyState === this.UNSENT || this.#abortedFlag) {
			return;
		}

		this.#abortedFlag = true;
		if (
			(this.readyState === this.OPENED && this.#sendFlag)
			|| this.readyState === this.HEADERS_RECEIVED
			|| this.readyState === this.LOADING
		) {
			this.#sendFlag = false;
			this.#reset();

			/**
			 * .abort() is the only function that directly modifies readyState
			 * If you abort in an event listener (like readystatechange) that could cause abort to run before
			 * the rest of the readystatechange event listeners (because everything is synchronous).
			 * That's why it needs to run on the next tick so that all the other event listeners have got to run
			 */
			process.nextTick(() => {
				this.#setState(this.DONE);
			});
		}
	};

	/**
	 * Adds an event listener. Preferred method of binding to events.
	 */
	addEventListener = (event: Events, callback: () => void) => {
		event = event.toLowerCase() as Events;
		(this.#listeners[event] ??= []).push(callback);
	};

	/**
	 * Remove an event callback that has already been bound.
	 * Only works on the matching funciton, cannot be a copy.
	 */
	removeEventListener = (event: Events, callback: () => void) => {
		const listeners = this.#listeners;
		const specificListeners = listeners[event];

		if (specificListeners) {
			for (let i = 0; i < specificListeners.length; ++i) {
				if (specificListeners[i] === callback) {
					specificListeners.splice(i--, 1);
				}
			}
		}
	};

	/**
	 * Changes readyState and calls onreadystatechange.
	 *
	 * @param int state New state
	 */
	#setState = (state: 0 | 1 | 2 | 3 | 4) => {
		if (
			(this.readyState === state && state !== this.LOADING)
			|| (this.readyState === this.UNSENT && this.#abortedFlag)
		) {
			return;
		}

		this.readyState = state;

		// Not on UNSENT
		// OPENED gets called seperately
		if (state > this.OPENED) {
			this.#dispatchEvent('readystatechange');
		}

		if (state === this.DONE) {
			let fire: Events;

			if (this.#errorFlag) {
				fire = 'error';
			} else if (this.#abortedFlag) {
				fire = 'abort';
			} else if (this.#timeoutFlag) {
				fire = 'timeout';
			} else {
				fire = 'load';
			}

			this.#dispatchEvent(fire);

			// @TODO figure out InspectorInstrumentation::didLoadXHR(cookie)
			this.#dispatchEvent('loadend');
		}
	};

	#fetchDataURI = (url: URL) => {
		this.#response = {
			headers: {},
			destroy: noop,
		};

		this.#dispatchEvent('loadstart');

		try {
			const buffer = dataUriToBuffer(url.href);

			this.#simulateEventsWith(buffer, buffer.typeFull, url, {
				extraProgressEvent: true,
			});
		} catch {
			this.#handleError();
		}
	};

	/**
	 * @param {URL} url
	 */
	#fetchBlob = (url: URL) => {
		const blob = resolveObjectURL(url.href);

		const method = this.#settings?.method ?? 'GET';

		this.#dispatchEvent('loadstart');

		if (blob === undefined) {
			this.responseURL = '';
			this.#handleError();
		} else if (method === 'GET') {
			void blob.arrayBuffer().then(ab => {
				this.#simulateEventsWith(Buffer.from(ab), blob.type, url, {
					extraProgressEvent: false,
				});
			});
		} else {
			this.#handleError(url);
		}
	};

	#simulateEventsWith = (
		buffer: Buffer,
		type: string,
		url: URL,
		options: {extraProgressEvent: boolean},
	) => {
		this.#response = {
			headers: {},
			destroy: noop,
		};
		const response = this.#response;

		response.headers = {
			'content-type': type,
			'content-length': `${buffer.length}`,
		};
		this.status = 200;
		this.statusText = http.STATUS_CODES[200]!;
		this.responseURL = url.href;
		this.#setState(this.HEADERS_RECEIVED);

		this.responseBuffer = Buffer.from(buffer);
		this.#setState(this.LOADING);
		this.#dispatchEvent('progress');
		if (options.extraProgressEvent && buffer.length > 0) {
			// Data-uris that aren't empty have two progress events
			this.#dispatchEvent('progress');
		}

		this.#setState(this.DONE);
	};

	#fetchHttp = (url: URL, data?: Buffer) => {
		const headers = this.#headers;
		const settings = this.#settings!;

		const host = url.hostname;
		const ssl = url.protocol === 'https:';
		// Default to port 80. If accessing localhost on another port be sure
		// to use http://localhost:port/path
		const port = url.port || (ssl ? 443 : 80);

		// Set the Host header or the server may reject the request
		headers['host'] = host;
		if (ssl ? port !== 443 : port !== 80) {
			headers['host'] += `:${url.port}`;
		}

		// Set Basic Auth if necessary
		if (settings.user) {
			settings.password ??= '';

			const authBuf = Buffer.from(`${settings.user}:${settings.password}`);
			headers['authorization'] = `Basic ${authBuf.toString('base64')}`;
		}

		// Set content length header
		if (settings.method === 'GET' || settings.method === 'HEAD') {
			data = undefined;
		} else if (data) {
			headers['content-length'] = String(data.length);
		} else if (settings.method === 'POST') {
			// For a post with no data set Content-Length: 0.
			// This is required by buggy servers that don't meet the specs.
			headers['content-length'] = '0';
		}

		// Reset error flag
		this.#errorFlag = false;
		// Use the proper protocol
		const doRequest = (ssl ? https : http).request as typeof http.request;

		// Request is being sent, set send flag
		this.#sendFlag = true;

		// Handler for the response
		const responseHandler = async (response: Response) => {
			if (this.#abortedFlag || this.#errorFlag || this.#timeoutFlag) {
				response.destroy();
				return;
			}

			// Set response var to the response we got back
			// This is so it remains accessable outside this scope
			this.#response = response;
			this.responseURL = response.responseUrl;

			this.#setState(this.HEADERS_RECEIVED);
			this.status = response.statusCode!;

			const bufferItems: Buffer[] = [];
			const appendBuffer = (buf: Buffer) => {
				bufferItems.push(buf);
				this.responseBuffer = Buffer.concat(bufferItems);
			};

			try {
				for await (const chunk of response) {
					appendBuffer(chunk as Buffer);
					if (this.#sendFlag) {
						this.#setState(this.LOADING);
					}

					this.#dispatchEvent('progress');
				}

				this.statusText = http.STATUS_CODES[response.statusCode!]!;
				clearTimeout_();

				if (this.#sendFlag) {
					// The this.#sendFlag needs to be set before setState is called.  Otherwise if we are chaining callbacks
					// there can be a timing issue (the callback is called and a new call is made before the flag is reset).
					this.#sendFlag = false;
					// Discard the 'end' event if the connection has been aborted
					this.#setState(this.DONE);
				}
			} catch {
				clearTimeout_();
				this.#handleError();
			}
		};

		// Create the request
		const request = doRequest(
			url,
			{
				method: settings.method,
				headers,
			},
			responseHandler,
		).on('error', () => {
			clearTimeout_();

			this.#handleError();
		});

		let timeout: NodeJS.Timeout | undefined;

		if (this.timeout > 0) {
			timeout = setTimeout(this.#onTimeout, this.timeout);
		}

		const clearTimeout_ = () => {
			if (timeout) {
				clearTimeout(timeout);
			}
		};

		this.#request = request;

		// Node 0.4 and later won't accept empty data. Make sure it's needed.
		if (data) {
			request.write(data);
		}

		request.end();

		this.#dispatchEvent('loadstart');
	};

	/**
	 * Called when an error is encountered to deal with it.
	 * @param {URL} url If the url is still accessible even on error
	 */
	#handleError = (url?: URL) => {
		this.responseURL = url?.href ?? '';
		this.status = 0;
		this.responseBuffer = Buffer.alloc(0);
		this.#errorFlag = true;
		this.#setState(this.DONE);
	};

	#reset = () => {
		this.#request?.destroy();
		this.#request &&= undefined;

		this.#response?.destroy();
		// Allow access to headers

		this.#headers = {...defaultHeaders};
		this.responseBuffer = Buffer.alloc(0);
		this.responseURL = '';
	};

	#onTimeout = () => {
		this.#reset();

		this.#timeoutFlag = true;

		this.#setState(this.DONE);
	};

	/**
	 * Dispatch any events, including both "on" methods and events attached using addEventListener.
	 */
	#dispatchEvent = (event: Events) => {
		const onFunction = this[`on${event}`];
		const listeners = this.#listeners;
		const functionArray = listeners[event];

		if (typeof onFunction === 'function') {
			onFunction.call(this);
		}

		if (functionArray) {
			for (const eventHandler of functionArray) {
				eventHandler.call(this);
			}
		}
	};
}

export {XMLHttpRequest};
