import { nanoid } from "nanoid";
import { App, PluginManifest, TFile } from "obsidian";

const DEVICE_ID_KEY = "vertical-tabs:device-id";

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

	private loadDeviceID() {
		let deviceID = localStorage.getItem(DEVICE_ID_KEY);
		if (!deviceID) {
			deviceID = nanoid();
			localStorage.setItem(DEVICE_ID_KEY, deviceID);
		}
		return deviceID;
	}

	private normalizePath(path: string) {
		path = path.replace(/([\\/])+/g, "/");
		path = path.replace(/(^\/+|\/+$)/g, "");
		path = path === "" ? "/" : path;
		path = path.replace(/\u00A0|\u202F/g, " ");
		return path;
	}

	private constructSafeFilePathFrom(key: string) {
		const defaultDir = `${this.app.vault.configDir}/plugins/${this.manifest.id}`;
		const dir = this.manifest.dir ?? defaultDir;
		const unsafeFilePath = `${dir}/${key}.json`;
		const normalizedPath = this.normalizePath(unsafeFilePath);
		return normalizedPath.normalize("NFC");
	}

	private async writeObjectToFile<T>(key: string, value: T): Promise<void> {
		try {
			const filePath = this.constructSafeFilePathFrom(key);
			await this.app.vault.writeJson(filePath, value as object);
		} catch (error) {
			console.error(`Failed to write to file ${key}:`, error);
			throw new Error(`Failed to write to file ${key}: ${error.message}`);
		}
	}

	private async readObjectFromFile<T>(key: string): Promise<T | null> {
		try {
			const filePath = this.constructSafeFilePathFrom(key);
			return (await this.app.vault.readJson(filePath)) as T;
		} catch (error) {
			console.error(`Failed to read from file ${key}:`, error);
			return null;
		}
	}

	private async hasFile(key: string): Promise<boolean> {
		const filePath = this.constructSafeFilePathFrom(key);
		return await this.app.vault.exists(filePath);
	}

	get prefix(): string {
		return `vertical-tabs:${this.installationID}:${this.deviceID}`;
	}

	async get<T>(key: string): Promise<T | null> {
		try {
			const value = localStorage.getItem(`${this.prefix}:${key}`);
			if (value) {
				return JSON.parse(value) as T;
			}
			const fileExists = await this.hasFile(key);
			if (fileExists) {
				return await this.readObjectFromFile<T>(key);
			}
			return null;
		} catch (error) {
			console.error(`Failed to get value for key ${key}:`, error);
			return null;
		}
	}

	async set<T>(key: string, value: T, largeBlob = false): Promise<void> {
		try {
			if (largeBlob) {
				await this.writeObjectToFile(key, value);
			} else {
				localStorage.setItem(
					`${this.prefix}:${key}`,
					JSON.stringify(value)
				);
			}
		} catch (error) {
			console.error(`Failed to set value for key ${key}:`, error);
			throw new Error(
				`Failed to set value for key ${key}: ${error.message}`
			);
		}
	}

	async remove(key: string): Promise<void> {
		try {
			localStorage.removeItem(`${this.prefix}:${key}`);
			const filePath = this.constructSafeFilePathFrom(key);
			const file = this.app.vault.getFileByPath(filePath);
			if (file) await this.app.vault.delete(file);
		} catch (error) {
			console.error(`Failed to remove key ${key}:`, error);
			throw new Error(`Failed to remove key ${key}: ${error.message}`);
		}
	}

	async has(key: string): Promise<boolean> {
		try {
			return (
				localStorage.getItem(`${this.prefix}:${key}`) !== null ||
				(await this.hasFile(key))
			);
		} catch (error) {
			console.error(`Failed to check existence of key ${key}:`, error);
			return false;
		}
	}
}
