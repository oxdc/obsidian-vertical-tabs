import { App } from "obsidian";

class LocalStorageService {
	private app: App | null = null;

	init(app: App): void {
		this.app = app;
	}

	private ensureInitialized(): App {
		if (!this.app) {
			throw new Error(
				"LocalStorageService not initialized. Call init() at plugin startup."
			);
		}
		return this.app;
	}

	save(key: string, value: string): void {
		const app = this.ensureInitialized();
		app.saveLocalStorage(key, value);
	}

	load(key: string): string | null {
		const app = this.ensureInitialized();
		const stored = app.loadLocalStorage(key);
		return typeof stored === "string" ? stored : null;
	}

	remove(key: string): void {
		const app = this.ensureInitialized();
		app.saveLocalStorage(key, "");
	}
}

export const localStorageService = new LocalStorageService();
