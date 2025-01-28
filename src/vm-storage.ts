import {BetterWeakMap} from './utils/index.js';
import {getUserscriptId} from './violentmonkey-context.js';

/** @internal */
class VMStorage<V> {
	private readonly storages = new BetterWeakMap<symbol, V>();

	constructor(private readonly getDefaultValue: () => V) {}

	get: {
		(setDefault: true): V;
		(setDefault: false): V | undefined;
	} = setDefault =>
		this.storages.get(
			getUserscriptId(),
			(setDefault ? this.getDefaultValue : undefined)!,
		);

	set = (value: V) => {
		this.storages.set(getUserscriptId(), value);
		return this;
	};
}

export {VMStorage};
