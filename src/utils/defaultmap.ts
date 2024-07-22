export default class DefaultRecord<K, V> extends Map<K, V> {
	factory: () => V;

	constructor(
		factory: () => V,
		entries?: readonly (readonly [K, V])[] | null
	) {
		super(entries);
		this.factory = factory;
	}

	get(key: K): V {
		if (!this.has(key)) {
			this.set(key, this.factory());
		}
		return super.get(key) ?? this.factory();
	}
}
