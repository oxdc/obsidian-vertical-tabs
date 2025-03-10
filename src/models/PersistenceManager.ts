import { nanoid } from "nanoid";
import { App, PluginManifest } from "obsidian";

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

	private async writeObjectToFile<T>(key: string, value: T) {
		const filePath = this.constructSafeFilePathFrom(key);
		await this.app.vault.writeJson(filePath, value as object);
	}

	private async readObjectFromFile<T>(key: string): Promise<T | null> {
		const filePath = this.constructSafeFilePathFrom(key);
		return this.app.vault.readJson(filePath) as T | null;
	}

	private async hasFile(key: string): Promise<boolean> {
		const filePath = this.constructSafeFilePathFrom(key);
		return this.app.vault.exists(filePath);
	}

	get prefix() {
		return `vertical-tabs:${this.installationID}:${this.deviceID}`;
	}

	async get<T>(key: string): Promise<T | null> {
		const value = localStorage.getItem(`${this.prefix}:${key}`);
		if (value) {
			return JSON.parse(value) as T;
		}
		const fileExists = await this.hasFile(key);
		if (fileExists) {
			return await this.readObjectFromFile<T>(key);
		}
		return null;
	}

	async set<T>(key: string, value: T, largeBlob = false) {
		if (largeBlob) {
			await this.writeObjectToFile(key, value);
		} else {
			localStorage.setItem(
				`${this.prefix}:${key}`,
				JSON.stringify(value)
			);
		}
	}

	async remove(key: string) {
		localStorage.removeItem(`${this.prefix}:${key}`);
		const filePath = this.constructSafeFilePathFrom(key);
		const file = this.app.vault.getFileByPath(filePath);
		if (file) await this.app.vault.delete(file);
	}

	async has(key: string): Promise<boolean> {
		return (
			localStorage.getItem(`${this.prefix}:${key}`) !== null ||
			(await this.hasFile(key))
		);
	}
}
