import { nanoid } from "nanoid";
import { App, normalizePath, PluginManifest } from "obsidian";

const DEVICE_ID_KEY = "vertical-tabs:device-id";
const JSON_EXTENSION = ".json";

enum DataScope {
	Device, // visible in all vaults on this device
	Vault, // visible in this vault on all devices
	Instance, // visible in this vault on this device
}

interface AsyncStorageOperations<T> {
	get<V extends T>(key: string): Promise<V | null>;
	set<V extends T>(key: string, value: V): Promise<void>;
	has(key: string): Promise<boolean>;
	remove(key: string): Promise<void>;
}

interface SyncStorageOperations<T> {
	get<V extends T>(key: string): V | null;
	set<V extends T>(key: string, value: V): void;
	has(key: string): boolean;
	remove(key: string): void;
}

class PersistenceError extends Error {
	readonly cause: Error;

	constructor(operation: string, key: string, originalError: Error) {
		super(`Failed to ${operation} ${key}: ${originalError.message}`);
		this.name = "PersistenceError";
		this.cause = originalError;
	}
}

/**
 * Manages persistent storage for the plugin, handling both localStorage and file-based storage
 * @template T - The type of data being stored
 */
export class PersistenceManager<T = unknown> {
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

	private handleError(operation: string, key: string, error: Error): never {
		const persistenceError = new PersistenceError(operation, key, error);
		console.error(persistenceError);
		throw persistenceError;
	}

	private prefix(scope: DataScope): string {
		switch (scope) {
			case DataScope.Device:
				return `vertical-tabs-${this.deviceID}`;
			case DataScope.Vault:
				return `vertical-tabs-${this.installationID}`;
			case DataScope.Instance:
				return `vertical-tabs-${this.installationID}-${this.deviceID}`;
		}
	}

	private getStorageKey(key: string, scope: DataScope): string {
		return `${this.prefix(scope)}:${key}`;
	}

	private constructSafeFilePathFrom(filename: string): string {
		const defaultDir = `${this.app.vault.configDir}/plugins/${this.manifest.id}`;
		const dir = this.manifest.dir ?? defaultDir;
		return normalizePath(`${dir}/${filename}${JSON_EXTENSION}`);
	}

	private async writeToFile<T>(storageKey: string, value: T): Promise<void> {
		try {
			const filePath = this.constructSafeFilePathFrom(storageKey);
			await this.app.vault.writeJson(
				filePath,
				value as unknown as object
			);
		} catch (error) {
			this.handleError("write", storageKey, error);
		}
	}

	private async readFromFile<T>(storageKey: string): Promise<T | null> {
		try {
			const filePath = this.constructSafeFilePathFrom(storageKey);
			return (await this.app.vault.readJson(filePath)) as unknown as T;
		} catch (error) {
			this.handleError("read", storageKey, error);
			return null;
		}
	}

	private async hasFile(key: string): Promise<boolean> {
		try {
			const filePath = this.constructSafeFilePathFrom(key);
			return await this.app.vault.exists(filePath);
		} catch (error) {
			this.handleError("hasFile", key, error);
			return false;
		}
	}

	private async removeFile(key: string): Promise<void> {
		try {
			const filePath = this.constructSafeFilePathFrom(key);
			await this.app.vault.adapter.remove(filePath);
		} catch (error) {
			this.handleError("removeFile", key, error);
		}
	}

	private writeToLocalStorage<T>(storageKey: string, value: T): void {
		try {
			localStorage.setItem(storageKey, JSON.stringify(value));
		} catch (error) {
			this.handleError("write", storageKey, error);
		}
	}

	private readFromLocalStorage<T>(storageKey: string): T | null {
		try {
			const value = localStorage.getItem(storageKey);
			return value ? (JSON.parse(value) as T) : null;
		} catch (error) {
			this.handleError("read", storageKey, error);
			return null;
		}
	}

	private hasLocalStorageItem(storageKey: string): boolean {
		try {
			return localStorage.getItem(storageKey) !== null;
		} catch (error) {
			return false;
		}
	}

	private removeLocalStorageItem(storageKey: string): void {
		try {
			localStorage.removeItem(storageKey);
		} catch (error) {
			this.handleError("removeLocalStorageItem", storageKey, error);
		}
	}

	/**
	 * Device-scoped storage operations - data persists across vaults on this device
	 * Operations are synchronous since they use localStorage
	 */
	device: SyncStorageOperations<T> = {
		get: <V extends T>(key: string): V | null => {
			const storageKey = this.getStorageKey(key, DataScope.Device);
			return this.readFromLocalStorage<V>(storageKey);
		},
		set: <V extends T>(key: string, value: V): void => {
			const storageKey = this.getStorageKey(key, DataScope.Device);
			this.writeToLocalStorage(storageKey, value);
		},
		has: (key: string): boolean => {
			const storageKey = this.getStorageKey(key, DataScope.Device);
			return this.hasLocalStorageItem(storageKey);
		},
		remove: (key: string): void => {
			const storageKey = this.getStorageKey(key, DataScope.Device);
			this.removeLocalStorageItem(storageKey);
		},
	};

	/**
	 * Vault-scoped storage operations - data persists across devices for this vault
	 * Operations are asynchronous since they use file system
	 */
	vault: AsyncStorageOperations<T> = {
		get: async <V extends T>(key: string): Promise<V | null> => {
			const storageKey = this.getStorageKey(key, DataScope.Vault);
			return this.readFromFile<V>(storageKey);
		},
		set: async <V extends T>(key: string, value: V): Promise<void> => {
			const storageKey = this.getStorageKey(key, DataScope.Vault);
			await this.writeToFile(storageKey, value);
		},
		has: async (key: string): Promise<boolean> => {
			const storageKey = this.getStorageKey(key, DataScope.Vault);
			return this.hasFile(storageKey);
		},
		remove: async (key: string): Promise<void> => {
			const storageKey = this.getStorageKey(key, DataScope.Vault);
			await this.removeFile(storageKey);
		},
	};

	/**
	 * Instance-scoped storage operations - data only persists for this vault on this device
	 * Operations are synchronous since they use localStorage
	 */
	instance: SyncStorageOperations<T> = {
		get: <V extends T>(key: string): V | null => {
			const storageKey = this.getStorageKey(key, DataScope.Instance);
			return this.readFromLocalStorage<V>(storageKey);
		},
		set: <V extends T>(key: string, value: V): void => {
			const storageKey = this.getStorageKey(key, DataScope.Instance);
			this.writeToLocalStorage(storageKey, value);
		},
		has: (key: string): boolean => {
			const storageKey = this.getStorageKey(key, DataScope.Instance);
			return this.hasLocalStorageItem(storageKey);
		},
		remove: (key: string): void => {
			const storageKey = this.getStorageKey(key, DataScope.Instance);
			this.removeLocalStorageItem(storageKey);
		},
	};
}
