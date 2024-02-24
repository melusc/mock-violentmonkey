import {Buffer} from 'node:buffer';
import {randomUUID} from 'node:crypto';
import type {AddressInfo} from 'node:net';
import process from 'node:process';
import {setTimeout as pSetTimeout} from 'node:timers/promises';
import {fileURLToPath} from 'node:url';

import type {ExecutionContext, Macro} from 'ava';
import express, {Router, type Express, type Request} from 'express';

export async function requestBodyToBuffer(request: Request) {
	const chunks: any[] = [];

	for await (const chunk of request) {
		chunks.push(chunk);
	}

	return Buffer.concat(chunks);
}

type ServerInfo = {
	baseUrl: string;
	app: Express;
	resolve(path: string): string;
};
type TestingFunction = (
	t: ExecutionContext,
	serverInfo: ServerInfo,
) => Promise<void> | void;

// eslint-disable-next-line new-cap
const usefulRoutes = Router();
usefulRoutes.get('/base64/:encoded', (request, response) => {
	const {encoded} = request.params;
	response
		.status(200)
		.write(Buffer.from(encoded, 'base64url').toString('utf8'));
	response.end();
});
usefulRoutes.get('/uuid', (_request, response) => {
	const uuid = randomUUID();
	response.status(200).send(uuid);
});
usefulRoutes.get('/status/:status', (request, response) => {
	const status = Number.parseInt(request.params.status, 10);
	if (Number.isFinite(status)) {
		response.status(status).send(String(status));
	} else {
		response.status(400).send('Invalid status code');
	}
});
usefulRoutes.get('/delay/:delay', async (request, response) => {
	const start = Date.now();
	const delay = Number.parseInt(request.params.delay, 10);
	if (Number.isFinite(delay)) {
		if (delay > 10 || delay < 0) {
			response.status(400).send('Must satisfy 0 <= delay <= 10');
			return;
		}

		await pSetTimeout(delay * 1000);
		response.status(200).send({
			start,
			end: Date.now(),
		});
	} else {
		response.status(400).send('Not finite number');
	}
});
usefulRoutes.post('/echo', async (request, response) => {
	response.status(200);
	request.pipe(response);
});

const serverFilesDirectory = new URL(
	'../../../test/_helpers/server-files/',
	import.meta.url,
);
usefulRoutes.get('/html', async (_request, response) => {
	response.sendFile(
		fileURLToPath(new URL('document.html', serverFilesDirectory)),
	);
});
usefulRoutes.get('/json', async (_request, response) => {
	response.sendFile(fileURLToPath(new URL('data.json', serverFilesDirectory)));
});
usefulRoutes.get('/image', async (_request, response) => {
	response.sendFile(fileURLToPath(new URL('image.jpeg', serverFilesDirectory)));
});

function getInteger(
	name: string,
	defaultValue: number,
	qs: Record<string, unknown>,
): number | string {
	const value = qs[name];
	if (value === undefined) {
		return defaultValue;
	}

	if (typeof value === 'string') {
		const parsed = Number.parseInt(value, 10);
		if (Number.isInteger(parsed)) {
			return parsed;
		}
	}

	return `${name} was not a single integer.`;
}

usefulRoutes.get('/drip', async (request, response) => {
	const search = request.query;
	const duration = getInteger('duration', 1, search);
	if (typeof duration === 'string') {
		response.status(400).send(duration);
		return;
	}

	const numberBytes = getInteger('numbytes', 10, search);
	if (typeof numberBytes === 'string') {
		response.status(400).send(duration);
		return;
	}

	response.status(200);
	const delay = (duration * 1000) / numberBytes;
	for (let i = 0; i < numberBytes; ++i) {
		if (i > 0) {
			// eslint-disable-next-line no-await-in-loop
			await pSetTimeout(delay);
		}

		response.write('*');
	}

	response.end();
});
usefulRoutes.get('/headers', async (request, response) => {
	response.status(200).send(request.headers);
});

export const createTestHttpServer: Macro<[TestingFunction]> = {
	async exec(t: ExecutionContext, run: TestingFunction) {
		const app = express();
		app.use(usefulRoutes);
		app.disable('x-powered-by');

		return new Promise(resolve => {
			async function close() {
				return new Promise<void>((resolve, reject) => {
					server.close(error => {
						if (error) {
							reject(error);
						} else {
							resolve();
						}
					});
				});
			}

			registerShutdown(close);
			const server = app.listen(async () => {
				const addressInfo = server.address();
				const {port} = addressInfo as AddressInfo;
				const baseUrl = new URL(`http://localhost:${port}/`);
				try {
					await run(t, {
						baseUrl: baseUrl.href,
						app,
						resolve(path: string) {
							return new URL(path, baseUrl).href;
						},
					});
				} finally {
					await close();
				}

				resolve();
			});
		});
	},
};

let registered = false;
const onShutdownCallbacks = new Set<() => void>();

function registerShutdown(function_: () => void) {
	onShutdownCallbacks.add(function_);

	if (registered) {
		return;
	}

	let run = false;
	function wrapper() {
		if (!run) {
			run = true;
			for (const callback of onShutdownCallbacks) {
				callback();
			}
		}
	}

	registered = true;

	process.on('SIGINT', wrapper);
	process.on('SIGTERM', wrapper);
	process.on('exit', wrapper);
}
