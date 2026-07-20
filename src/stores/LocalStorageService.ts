import { App } from "obsidian";

// prettier-ignore
class LocalStorageService {
	private app: App | null = null;

	init(app: App): void {
		this.app = app;
	}

	private ensureInitialized(): App {
		if (!this.app) throw new Error("LocalStorageService not initialized.");
		return this.app;
	}

	save<T>(key: string, value: T): void;
	save<T>(key: string, value: T, encoder: (value: T) => string): void;
	save<T>(key: string, value: T, encoder?: (value: T) => string): void {
		const app = this.ensureInitialized();
		const serialized = encoder ? encoder(value) : typeof value === "string" ? value : JSON.stringify(value);
		app.saveLocalStorage(key, serialized);
	}

	load<T>(key: string): T | null;
	load<T>(key: string, decoder: (value: string) => T | null): T | null;
	load<T>(key: string, decoder?: (value: string) => T | null): T | null {
		const app = this.ensureInitialized();
		const stored = app.loadLocalStorage(key);
		if (typeof stored !== "string") return null;
		if (!stored) return null;
		try { return decoder ? decoder(stored) : (JSON.parse(stored) as T); }
    catch { return null; }
	}

	remove(key: string): void {
		const app = this.ensureInitialized();
		app.saveLocalStorage(key, "");
	}

	migrate<T>(key: string): T | null;
	migrate<T>(key: string, decoder: (value: string) => T | null): T | null;
	migrate<T>(key: string, decoder?: (value: string) => T | null): T | null {
		const existing = decoder ? this.load(key, decoder) : this.load<T>(key);
		if (existing !== null) return existing;
		const legacy = localStorage.getItem(key);
		if (!legacy) return null;
		try {
			const value = decoder ? decoder(legacy) : (JSON.parse(legacy) as T);
			if (value === null) return null;
			this.save(key, legacy);
			localStorage.removeItem(key);
			return value;
		} catch {
			return null;
		}
	}

	migrateFrom<T>(key: string, legacyKeys: string[]): T | null;
	migrateFrom<T>(key: string,legacyKeys: string[], decoder: (value: string) => T | null): T | null;
	migrateFrom<T>(key: string, legacyKeys: string[], decoder?: (value: string) => T | null): T | null {
		const existing = decoder ? this.load(key, decoder) : this.load<T>(key);
		if (existing !== null) return existing;
		const app = this.ensureInitialized();
		for (const legacyKey of legacyKeys) {
			const scoped = app.loadLocalStorage(legacyKey);
			const legacy = typeof scoped === "string" && scoped ? scoped : localStorage.getItem(legacyKey);
			if (!legacy) continue;
			try {
				const value = decoder ? decoder(legacy) : (JSON.parse(legacy) as T);
				if (value === null) continue;
				this.save(key, legacy);
				this.remove(legacyKey);
				localStorage.removeItem(legacyKey);
				return value;
			} catch {
				continue;
			}
		}
		return decoder ? this.migrate(key, decoder) : this.migrate<T>(key);
	}
}

export const localStorageService = new LocalStorageService();
