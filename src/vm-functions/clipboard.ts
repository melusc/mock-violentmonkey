import {VMStorage} from '../vm-storage.js';

const clipboardDataStorage = new VMStorage<{data: string; type: string}>(
	() => ({data: '', type: 'text/plain'}),
);

type SetClipboard = (data: string, type?: string) => void;
const setClipboard: SetClipboard = (data, type = 'text/plain') =>
	clipboardDataStorage.set({data, type});

const getClipboard = () => {
	const clipboardData = clipboardDataStorage.get(false);

	return clipboardData && {...clipboardData};
};

export {setClipboard as GM_setClipboard, getClipboard, type SetClipboard};

Object.defineProperty(globalThis, 'GM_setClipboard', {
	value: setClipboard,
});
