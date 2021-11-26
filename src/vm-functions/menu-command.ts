import {BetterMap} from '../utils/index.js';
import {VMStorage} from '../vm-storage.js';

const menuCommands = new VMStorage<BetterMap<string, () => void>>(
	() => new BetterMap(),
);

type RegisterMenuCommand = (caption: string, onclick: () => void) => string;
const registerMenuCommand: RegisterMenuCommand = (caption, onclick) => {
	menuCommands.get(true).set(caption, onclick);

	return caption;
};

type UnregisterMenuCommand = (caption: string) => void;
const unregisterMenuCommand: UnregisterMenuCommand = caption => {
	menuCommands.get(false)?.delete(caption);
};

const triggerMenuCommand = (caption: string) => {
	menuCommands.get(false)?.get(caption)?.();
};

export {
	registerMenuCommand as GM_registerMenuCommand,
	unregisterMenuCommand as GM_unregisterMenuCommand,
	triggerMenuCommand,
	/*****/
	RegisterMenuCommand,
	UnregisterMenuCommand,
};

Object.defineProperties(global, {
	GM_registerMenuCommand: {
		value: registerMenuCommand,
	},
	GM_unregisterMenuCommand: {
		value: unregisterMenuCommand,
	},
});
