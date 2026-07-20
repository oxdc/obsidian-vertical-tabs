import { requestUrl } from "obsidian";
import ObsidianVerticalTabs from "src/main";
import { STORAGE_KEYS } from "src/constants/StorageKeys";
import { localStorageService } from "src/stores/LocalStorageService";

interface CachedVersionData {
	latestVersion: string;
	timestamp: number;
}

const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds

const saveVersionCache = (versionCache: CachedVersionData) => {
	localStorageService.save(STORAGE_KEYS.VERSION_CACHE, versionCache);
};

const loadVersionCache = (): CachedVersionData | null => {
	return localStorageService.load<CachedVersionData>(
		STORAGE_KEYS.VERSION_CACHE
	);
};

export async function getLatestVersion(plugin: ObsidianVerticalTabs): Promise<{
	currentVersion: string;
	latestVersion: string | null;
}> {
	const currentVersion = plugin.manifest.version;

	// Respect user's preference to disable update checks
	if (!(plugin.settings.enableUpdateCheck ?? true)) {
		return {
			currentVersion,
			latestVersion: null,
		};
	}

	// Check cache first
	try {
		const cachedData = loadVersionCache();
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
			url: "https://github.com/oxdc/obsidian-vertical-tabs/raw/refs/heads/master/manifest.json",
			method: "GET",
		});
		const latestVersion = (response.json as { version: string }).version;

		// Cache the result
		try {
			saveVersionCache({
				latestVersion,
				timestamp: Date.now(),
			});
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
			const cachedData = loadVersionCache();
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
