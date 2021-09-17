/*
	Adds the boilerplate for getting a value, and setting a default value otherwise
*/

class BetterMap<K, V> extends Map<K, V> {
	/**
	 * @param getDefaultValue Return the value associated with the key.
	 * If that value does not exist it sets the result of `getDefaultValue()` and returns that.
	 */
	override get: {
		(key: K, getDefaultValue: () => V): V;
		(key: K, getDefaultValue?: undefined): V | undefined;
	} = (key, getDefaultValue?: () => V) => {
		if (!this.has(key) && getDefaultValue !== undefined) {
			const value = getDefaultValue();

			this.set(key, value);
			return value;
		}

		// The value is only undefined if getDefaultValue is undefined as well
		// If that is the case, the return-value is `V | undefined` anyway
		return super.get(key)!;
	};
}

export {BetterMap};
