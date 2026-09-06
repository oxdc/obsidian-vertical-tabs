import ObsidianVerticalTabs from "src/main";
import { STORAGE_KEYS } from "src/constants/StorageKeys";
import { localStorageService } from "src/stores/LocalStorageService";
import { metadataService } from "src/stores/TabMetadataService";
import { DEFAULT_GROUP_TITLE } from "src/constants/Predefined";
import { Identifier } from "src/models/VTWorkspace";

export function _rawLocalStorage(
	method: "getItem" | "setItem" | "removeItem",
	args: [string] | [string, string]
) {
	const target = localStorage;
	if (method === "getItem" || method === "removeItem") {
		return target[method](args[0]);
	} else if (method === "setItem" && args[1] !== undefined) {
		return target.setItem(args[0], args[1]);
	}
}

const DEVICE_ID_KEY = "vertical-tabs:device-id";

export async function runPersistenceMigrations(
	plugin: ObsidianVerticalTabs
): Promise<void> {
	const legacySettings = plugin.settings as typeof plugin.settings & {
		installationID?: string;
	};
	const installationID = legacySettings.installationID;
	const deviceID = _rawLocalStorage("getItem", [DEVICE_ID_KEY]);

	const instancePrefix =
		installationID && deviceID
			? `vertical-tabs-${installationID}-${deviceID}`
			: null;
	const devicePrefix = deviceID ? `vertical-tabs-${deviceID}` : null;

	localStorageService.migrateFrom<boolean>(STORAGE_KEYS.SHOW_ACTIVE_TABS, [
		...(instancePrefix ? [`${instancePrefix}:show-active-tabs`] : []),
		"show-active-tabs",
	]);
	localStorageService.migrateFrom<boolean>(
		STORAGE_KEYS.DISABLE_ON_THIS_DEVICE,
		[
			...(devicePrefix ? [`${devicePrefix}:disable-on-this-device`] : []),
			"disable-on-this-device",
		]
	);
	localStorageService.migrateFrom(STORAGE_KEYS.VERSION_CACHE, [
		...(devicePrefix ? [`${devicePrefix}:version-cache`] : []),
		"version-cache",
	]);
	localStorageService.migrateFrom(
		STORAGE_KEYS.SORT_STRATEGY,
		["sort-strategy"],
		(value) => value
	);
	localStorageService.migrateFrom(STORAGE_KEYS.GROUP_ORDER, [
		"temp-group-order",
	]);

	if (installationID !== undefined) {
		delete legacySettings.installationID;
		await plugin.saveSettings();
	}

	if (deviceID) {
		_rawLocalStorage("removeItem", [DEVICE_ID_KEY]);
	}

	await migrateGroupTitles();
}

// Migrate old group titles from "view-state" in LocalStorageService to the metadata store.
// This is temporary.
async function migrateGroupTitles(): Promise<void> {
	const entries =
		localStorageService.migrate<[Identifier, string][]>("view-state");
	if (!entries) return;
	for (const [id, title] of entries) {
		if (!title || title === DEFAULT_GROUP_TITLE) continue;
		await metadataService.setGroupMetadata(id, { title });
	}
}
