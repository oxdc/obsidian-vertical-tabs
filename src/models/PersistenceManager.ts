import { nanoid } from "nanoid";
import { App, normalizePath, PluginManifest } from "obsidian";

const DEVICE_ID_KEY = "vertical-tabs:device-id";
const JSON_EXTENSION = ".json";

/** Represents storage options for persistence */
interface StorageOptions {
	/** If true, stores data in file system instead of localStorage */
	largeBlob?: boolean;
}

/**
 * Manages persistent storage for the plugin, handling both localStorage and file-based storage
 */
export class PersistenceManager {
	readonly installationID: string;
	readonly deviceID: string;
	readonly manifest: PluginManifest;
	readonly app: App;

	constructor(app: App, installationID: string, manifest: PluginManifest) {
		this.app = app;
		this.installationID = installationID;
		this.deviceID = this.loadDeviceID();
		this.manifest = manifest;
	}

	private loadDeviceID(): string {
		const deviceID = localStorage.getItem(DEVICE_ID_KEY) ?? nanoid();
		localStorage.setItem(DEVICE_ID_KEY, deviceID);
		return deviceID;
	}

	private constructSafeFilePathFrom(key: string): string {
		const defaultDir = `${this.app.vault.configDir}/plugins/${this.manifest.id}`;
		const dir = this.manifest.dir ?? defaultDir;
		return normalizePath(`${dir}/${key}${JSON_EXTENSION}`);
	}

	private getStorageKey(key: string): string {
		return `${this.prefix}:${key}`;
	}

	private async writeObjectToFile<T>(key: string, value: T): Promise<void> {
		try {
			const filePath = this.constructSafeFilePathFrom(key);
			await this.app.vault.writeJson(
				filePath,
				value as unknown as object
			);
		} catch (error) {
			this.handleError("write", key, error);
		}
	}

	private async readObjectFromFile<T>(key: string): Promise<T | null> {
		try {
			const filePath = this.constructSafeFilePathFrom(key);
			return (await this.app.vault.readJson(filePath)) as unknown as T;
		} catch (error) {
			this.handleError("read", key, error);
			return null;
		}
	}

	private handleError(operation: string, key: string, error: Error): void {
		const message = `Failed to ${operation} ${key}: ${error.message}`;
		console.error(message, error);
		if (operation !== "read") {
			throw new Error(message);
		}
	}

	private async hasFile(key: string): Promise<boolean> {
		const filePath = this.constructSafeFilePathFrom(key);
		return await this.app.vault.exists(filePath);
	}

	get prefix(): string {
		return `vertical-tabs:${this.installationID}:${this.deviceID}`;
	}

	/**
	 * Retrieves a value from storage
	 * @param key The key to retrieve
	 * @returns The stored value or null if not found
	 */
	async get<T>(key: string): Promise<T | null> {
		try {
			const storageKey = this.getStorageKey(key);
			const value = localStorage.getItem(storageKey);

			if (value) {
				return JSON.parse(value) as T;
			}

			if (await this.hasFile(key)) {
				return await this.readObjectFromFile<T>(key);
			}

			return null;
		} catch (error) {
			this.handleError("get", key, error);
			return null;
		}
	}

	/**
	 * Stores a value in persistence
	 * @param key The key to store under
	 * @param value The value to store
	 * @param options Storage options
	 */
	async set<T>(
		key: string,
		value: T,
		options: StorageOptions = {}
	): Promise<void> {
		try {
			const storageKey = this.getStorageKey(key);

			if (options.largeBlob) {
				await this.writeObjectToFile(key, value);
				// Remove from localStorage after successful file write
				localStorage.removeItem(storageKey);
			} else {
				localStorage.setItem(storageKey, JSON.stringify(value));
				// Remove file if it exists
				if (await this.hasFile(key)) {
					const filePath = this.constructSafeFilePathFrom(key);
					await this.app.vault.adapter.remove(filePath);
				}
			}
		} catch (error) {
			this.handleError("set", key, error);
		}
	}

	/**
	 * Removes a value from storage
	 * @param key The key to remove
	 */
	async remove(key: string): Promise<void> {
		try {
			const storageKey = this.getStorageKey(key);
			localStorage.removeItem(storageKey);

			const filePath = this.constructSafeFilePathFrom(key);
			await this.app.vault.adapter.remove(filePath);
		} catch (error) {
			this.handleError("remove", key, error);
		}
	}

	/**
	 * Checks if a key exists in storage
	 * @param key The key to check
	 * @returns True if the key exists
	 */
	async has(key: string): Promise<boolean> {
		try {
			const storageKey = this.getStorageKey(key);
			return (
				localStorage.getItem(storageKey) !== null ||
				(await this.hasFile(key))
			);
		} catch (error) {
			this.handleError("check", key, error);
			return false;
		}
	}
}
