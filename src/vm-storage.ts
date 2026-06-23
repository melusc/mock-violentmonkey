import {BetterWeakMap} from './utils/index.js';
import {getUserscriptId} from './violentmonkey-context.js';

/** @internal */
class VMStorage<V> {
	private readonly storages = new BetterWeakMap<symbol, V>();

	constructor(private readonly getDefaultValue: () => V) {}

	get(setDefault: true): V;
	get(setDefault: false): V | undefined;
	get(setDefault: boolean) {
		return this.storages.get(
			getUserscriptId(),
			(setDefault ? this.getDefaultValue : undefined)!,
		);
	}

	set(value: V) {
		this.storages.set(getUserscriptId(), value);
		return this;
	}
}

export {VMStorage};
