import {Buffer} from 'node:buffer';

export interface MimeBuffer extends Buffer {
	type: string;
	typeFull: string;
	charset: string;
}

// https://github.com/TooTallNate/node-data-uri-to-buffer
// Copied here because ava doesn't support esm

/**
 * Returns a `Buffer` instance from the given data URI `uri`.
 *
 * @param {String} uri Data URI to turn into a Buffer instance
 * @returns {Buffer} Buffer instance from Data URI
 * @api public
 */
export function dataUriToBuffer(uri: string): MimeBuffer {
	if (new URL(uri).href !== uri) {
		throw new Error('new URL(uri).href !== uri');
	}

	if (!/^data:/i.test(uri)) {
		throw new TypeError(
			'`uri` does not appear to be a Data URI (must begin with "data:")',
		);
	}

	// Strip newlines
	uri = uri.replace(/\r?\n/g, '');

	// Split the URI up into the "metadata" and the "data" portions
	const firstComma = uri.indexOf(',');
	if (firstComma === -1) {
		throw new TypeError('malformed data: URI');
	}

	// Remove the "data:" scheme and parse the metadata
	const meta = uri.slice(5, firstComma).split(';');

	let charset = '';
	let base64 = false;
	// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
	const type = meta[0] || 'text/plain';
	let typeFull = type;
	for (let i = 1; i < meta.length; i++) {
		const currentMeta = meta[i];
		if (currentMeta === 'base64') {
			base64 = true;
		} else if (currentMeta) {
			typeFull += `;${currentMeta}`;
			if (currentMeta.startsWith('charset=')) {
				charset = currentMeta.slice(8);
			}
		}
	}

	// Defaults to US-ASCII only if type is not provided
	if (!meta[0] && charset.length === 0) {
		typeFull += ';charset=US-ASCII';
		charset = 'US-ASCII';
	}

	// Get the encoded data portion and decode URI-encoded chars
	const encoding = base64 ? 'base64' : 'ascii';
	const data = unescape(uri.slice(firstComma + 1));
	const buffer = Buffer.from(data, encoding) as MimeBuffer;

	// Set `.type` and `.typeFull` properties to MIME type
	buffer.type = type;
	buffer.typeFull = typeFull;

	// Set the `.charset` property
	buffer.charset = charset;

	return buffer;
}

export default dataUriToBuffer;
