import { nanoid } from "nanoid";
import { App } from "obsidian";

const DEVICE_ID_KEY = "vertical-tabs:device-id";

export class PersistenceManager {
	readonly installationID: string;
	readonly deviceID: string;
	readonly app: App;

	constructor(app: App, installationID: string) {
		this.app = app;
		this.installationID = installationID;
		this.deviceID = this.loadDeviceID();
	}

	private loadDeviceID() {
		let deviceID = localStorage.getItem(DEVICE_ID_KEY);
		if (!deviceID) {
			deviceID = nanoid();
			localStorage.setItem(DEVICE_ID_KEY, deviceID);
		}
		return deviceID;
	}

	get prefix() {
		return `vertical-tabs:${this.installationID}:${this.deviceID}`;
	}

	get<T>(key: string) {
		const value = localStorage.getItem(`${this.prefix}:${key}`);
		if (!value) return null;
		return JSON.parse(value) as T;
	}

	set<T>(key: string, value: T) {
		localStorage.setItem(`${this.prefix}:${key}`, JSON.stringify(value));
	}

	remove(key: string) {
		localStorage.removeItem(`${this.prefix}:${key}`);
	}

	has(key: string) {
		return localStorage.getItem(`${this.prefix}:${key}`) !== null;
	}

	clear() {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key?.startsWith(this.prefix)) {
				localStorage.removeItem(key);
			}
		}
	}
}
