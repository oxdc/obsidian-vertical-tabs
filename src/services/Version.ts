import { requestUrl } from "obsidian";
import ObsidianVerticalTabs from "src/main";
import { PersistenceManager } from "src/models/PersistenceManager";

interface CachedVersionData {
	latestVersion: string;
	timestamp: number;
}

const CACHE_KEY = "version-cache";
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour in milliseconds

export async function getLatestVersion(plugin: ObsidianVerticalTabs): Promise<{
	currentVersion: string;
	latestVersion: string | null;
}> {
	const currentVersion = plugin.manifest.version;

	// Ensure installationID is available
	if (!plugin.settings.installationID) {
		console.error("InstallationID not found in plugin settings");
		return {
			currentVersion,
			latestVersion: null,
		};
	}

	const persistence = new PersistenceManager<CachedVersionData>(
		plugin.app,
		plugin.settings.installationID,
		plugin.manifest
	);

	// Check cache first
	try {
		const cachedData = persistence.device.get<CachedVersionData>(CACHE_KEY);
		if (cachedData) {
			const now = Date.now();
			// If cache is still valid (less than 6 hours old)
			if (now - cachedData.timestamp < CACHE_DURATION) {
				return {
					currentVersion,
					latestVersion: cachedData.latestVersion,
				};
			}
		}
	} catch (error) {
		console.error("Failed to read version cache:", error);
	}

	// Cache is invalid or doesn't exist, fetch from API
	try {
		const response = await requestUrl({
			url: "https://api.github.com/repos/oxdc/obsidian-vertical-tabs/releases/latest",
			method: "GET",
		});
		const latestVersion = response.json.tag_name;

		// Cache the result
		try {
			const cacheData: CachedVersionData = {
				latestVersion,
				timestamp: Date.now(),
			};
			persistence.device.set(CACHE_KEY, cacheData);
		} catch (error) {
			console.error("Failed to cache version data:", error);
		}

		return {
			currentVersion,
			latestVersion,
		};
	} catch (error) {
		console.error("Failed to fetch latest version:", error);

		// Try to return cached data even if expired, as fallback
		try {
			const cachedData =
				persistence.device.get<CachedVersionData>(CACHE_KEY);
			if (cachedData) {
				return {
					currentVersion,
					latestVersion: cachedData.latestVersion,
				};
			}
		} catch (cacheError) {
			console.error(
				"Failed to read expired cache as fallback:",
				cacheError
			);
		}

		return {
			currentVersion,
			latestVersion: null,
		};
	}
}
