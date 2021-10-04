import {BetterMap} from '../utils';
import {getUserscriptId} from '../violentmonkey-context';

const menuCommands = new BetterMap<number, BetterMap<string, () => void>>();

type RegisterMenuCommand = (caption: string, onclick: () => void) => string;
const registerMenuCommand: RegisterMenuCommand = (caption, onclick) => {
	menuCommands
		.get(getUserscriptId(), () => new BetterMap())
		.set(caption, onclick);

	return caption;
};

type UnregisterMenuCommand = (caption: string) => void;
const unregisterMenuCommand: UnregisterMenuCommand = caption => {
	menuCommands.get(getUserscriptId())?.delete(caption);
};

const triggerMenuCommand = (caption: string) => {
	menuCommands.get(getUserscriptId())?.get(caption)?.();
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
