import http, {RequestListener} from 'node:http';
import process from 'node:process';

export const createServer = async (requestListener: RequestListener) =>
	new Promise<{server: http.Server; port: number}>(resolve => {
		const server = http.createServer(requestListener).listen(() => {
			resolve({server, port: (server.address() as {port: number}).port});
		});

		registerShutdown(() => server.close());
	});

const registerShutdown = (fn: () => void) => {
	let run = false;

	const wrapper = () => {
		if (!run) {
			run = true;
			fn();
		}
	};

	process.on('SIGINT', wrapper);
	process.on('SIGTERM', wrapper);
	process.on('exit', wrapper);
};
