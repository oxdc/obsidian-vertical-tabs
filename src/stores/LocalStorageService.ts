import { App } from "obsidian";

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
		// prettier-ignore
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
		// prettier-ignore
		try { return decoder ? decoder(stored) : (JSON.parse(stored) as T); }
    catch { return null; }
	}

	remove(key: string): void {
		const app = this.ensureInitialized();
		app.saveLocalStorage(key, "");
	}
}

export const localStorageService = new LocalStorageService();
