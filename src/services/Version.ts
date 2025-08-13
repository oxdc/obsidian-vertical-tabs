import { requestUrl } from "obsidian";
import ObsidianVerticalTabs from "src/main";
import { PersistenceManager } from "src/models/PersistenceManager";

interface CachedVersionData {
	latest_version: string;
	timestamp: number;
}

const CACHE_KEY = "version-cache";
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

export async function getLatestVersion(plugin: ObsidianVerticalTabs): Promise<{
	current_version: string;
	latest_version: string | null;
}> {
	const current_version = plugin.manifest.version;

	// Ensure installationID is available
	if (!plugin.settings.installationID) {
		console.error("InstallationID not found in plugin settings");
		return {
			current_version,
			latest_version: null,
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
					current_version,
					latest_version: cachedData.latest_version,
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
		const latest_version = response.json.tag_name;

		// Cache the result
		try {
			const cacheData: CachedVersionData = {
				latest_version,
				timestamp: Date.now(),
			};
			persistence.device.set(CACHE_KEY, cacheData);
		} catch (error) {
			console.error("Failed to cache version data:", error);
		}

		return {
			current_version,
			latest_version,
		};
	} catch (error) {
		console.error("Failed to fetch latest version:", error);

		// Try to return cached data even if expired, as fallback
		try {
			const cachedData =
				persistence.device.get<CachedVersionData>(CACHE_KEY);
			if (cachedData) {
				return {
					current_version,
					latest_version: cachedData.latest_version,
				};
			}
		} catch (cacheError) {
			console.error(
				"Failed to read expired cache as fallback:",
				cacheError
			);
		}

		return {
			current_version,
			latest_version: null,
		};
	}
}
