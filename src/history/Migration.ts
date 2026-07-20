import ObsidianVerticalTabs from "src/main";
import { STORAGE_KEYS } from "src/constants/StorageKeys";
import { localStorageService } from "src/stores/LocalStorageService";

const DEVICE_ID_KEY = "vertical-tabs:device-id";

export async function runPersistenceMigrations(
	plugin: ObsidianVerticalTabs
): Promise<void> {
	const legacySettings = plugin.settings as typeof plugin.settings & {
		installationID?: string;
	};
	const installationID = legacySettings.installationID;
	const deviceID = localStorage.getItem(DEVICE_ID_KEY);

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
	localStorageService.migrateFrom(STORAGE_KEYS.SORT_STRATEGY, [
		"sort-strategy",
	], (value) => value);
	localStorageService.migrateFrom(STORAGE_KEYS.GROUP_ORDER, [
		"temp-group-order",
	]);

	if (installationID !== undefined) {
		delete legacySettings.installationID;
		await plugin.saveSettings();
	}

	if (deviceID) {
		localStorage.removeItem(DEVICE_ID_KEY);
	}
}
