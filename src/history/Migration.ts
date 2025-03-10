import { PersistenceManager } from "src/models/PersistenceManager";
import ObsidianVerticalTabs from "src/main";

class MigrationContext {
	private static persistenceManager: PersistenceManager | null = null;

	static initialize(plugin: ObsidianVerticalTabs) {
		this.persistenceManager = plugin.persistenceManager;
	}

	static getPersistenceManager(): PersistenceManager {
		if (!this.persistenceManager) {
			throw new Error("MigrationContext not initialized");
		}
		return this.persistenceManager;
	}
}

const OBSOLETE_SHOW_ACTIVE_TABS_KEY = "vt-show-active-tabs";
const SHOW_ACTIVE_TABS_KEY = "show-active-tabs";

const OBSOLETE_SORT_STRATEGY_KEY = "sort-strategy";
const SORT_STRATEGY_KEY = "sort-strategy";

const OBSOLETE_TEMP_GROUP_ORDER_KEY = "temp-group-order";
const TEMP_GROUP_ORDER_KEY = "group-order";

const OBSOLETE_VIEW_STATE_KEY = "view-state";
const VIEW_STATE_KEY = "view-state";

const OBSOLETE_HIDDEN_GROUPS_KEY = "hidden-groups";
const HIDDEN_GROUPS_KEY = "hidden-groups";

const OBSOLETE_COLLAPSED_GROUPS_KEY = "collapsed-groups";
const COLLAPSED_GROUPS_KEY = "collapsed-groups";

const OBSOLETE_NONEPHEMERAL_TABS_KEY = "nonephemeral-tabs";
const NONEPHEMERAL_TABS_KEY = "nonephemeral-tabs";

export async function migrateShowActiveTabs(
	persistenceManager: PersistenceManager
): Promise<void> {
	const legacyValue = localStorage.getItem(OBSOLETE_SHOW_ACTIVE_TABS_KEY);
	if (legacyValue !== null) {
		const value = legacyValue === "true";
		await persistenceManager.set(SHOW_ACTIVE_TABS_KEY, value);
	}
}

export async function getShowActiveTabs(): Promise<boolean> {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Try new storage first
	const newValue = await persistenceManager.get<boolean>(
		SHOW_ACTIVE_TABS_KEY
	);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_SHOW_ACTIVE_TABS_KEY);
	if (legacyValue !== null) {
		const value = legacyValue === "true";
		// Migrate to new storage
		await persistenceManager.set(SHOW_ACTIVE_TABS_KEY, value);
		return value;
	}

	return false;
}

export async function setShowActiveTabs(value: boolean): Promise<void> {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_SHOW_ACTIVE_TABS_KEY, value.toString());
	await persistenceManager.set(SHOW_ACTIVE_TABS_KEY, value);
}

export async function migrateSortStrategy(
	persistenceManager: PersistenceManager
): Promise<void> {
	const legacyValue = localStorage.getItem(OBSOLETE_SORT_STRATEGY_KEY);
	if (legacyValue !== null) {
		await persistenceManager.set(SORT_STRATEGY_KEY, legacyValue);
	}
}

export async function getSortStrategy(): Promise<string> {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Try new storage first
	const newValue = await persistenceManager.get<string>(SORT_STRATEGY_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_SORT_STRATEGY_KEY);
	if (legacyValue !== null) {
		// Migrate to new storage
		await persistenceManager.set(SORT_STRATEGY_KEY, legacyValue);
		return legacyValue;
	}

	return "none";
}

export async function setSortStrategy(value: string): Promise<void> {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_SORT_STRATEGY_KEY, value);
	await persistenceManager.set(SORT_STRATEGY_KEY, value);
}

export async function migrateTempGroupOrder(
	persistenceManager: PersistenceManager
): Promise<void> {
	const legacyValue = localStorage.getItem(OBSOLETE_TEMP_GROUP_ORDER_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		await persistenceManager.set(TEMP_GROUP_ORDER_KEY, value);
	}
}

export async function getTempGroupOrder(
	persistenceManager: PersistenceManager
): Promise<string[]> {
	// Try new storage first
	const newValue = await persistenceManager.get<string[]>(
		TEMP_GROUP_ORDER_KEY
	);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_TEMP_GROUP_ORDER_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		// Migrate to new storage
		await persistenceManager.set(TEMP_GROUP_ORDER_KEY, value);
		return value;
	}

	return [];
}

export async function setTempGroupOrder(
	persistenceManager: PersistenceManager,
	value: string[]
): Promise<void> {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_TEMP_GROUP_ORDER_KEY, JSON.stringify(value));
	await persistenceManager.set(TEMP_GROUP_ORDER_KEY, value);
}

// ViewState migrations
export async function migrateViewState(
	persistenceManager: PersistenceManager
): Promise<void> {
	const legacyValue = localStorage.getItem(OBSOLETE_VIEW_STATE_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		await persistenceManager.set(VIEW_STATE_KEY, value);
	}
}

export async function getViewState<T>(
	persistenceManager: PersistenceManager
): Promise<T | null> {
	// Try new storage first
	const newValue = await persistenceManager.get<T>(VIEW_STATE_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_VIEW_STATE_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T;
		// Migrate to new storage
		await persistenceManager.set(VIEW_STATE_KEY, value);
		return value;
	}

	return null;
}

export async function setViewState<T>(
	persistenceManager: PersistenceManager,
	value: T
): Promise<void> {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_VIEW_STATE_KEY, JSON.stringify(value));
	await persistenceManager.set(VIEW_STATE_KEY, value);
}

// Hidden Groups migrations
export async function migrateHiddenGroups(
	persistenceManager: PersistenceManager
): Promise<void> {
	const legacyValue = localStorage.getItem(OBSOLETE_HIDDEN_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		await persistenceManager.set(HIDDEN_GROUPS_KEY, value);
	}
}

export async function getHiddenGroups<T>(
	persistenceManager: PersistenceManager
): Promise<T[]> {
	// Try new storage first
	const newValue = await persistenceManager.get<T[]>(HIDDEN_GROUPS_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_HIDDEN_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T[];
		// Migrate to new storage
		await persistenceManager.set(HIDDEN_GROUPS_KEY, value);
		return value;
	}

	return [];
}

export async function setHiddenGroups<T>(
	persistenceManager: PersistenceManager,
	value: T[]
): Promise<void> {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_HIDDEN_GROUPS_KEY, JSON.stringify(value));
	await persistenceManager.set(HIDDEN_GROUPS_KEY, value);
}

// Collapsed Groups migrations
export async function migrateCollapsedGroups(
	persistenceManager: PersistenceManager
): Promise<void> {
	const legacyValue = localStorage.getItem(OBSOLETE_COLLAPSED_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		await persistenceManager.set(COLLAPSED_GROUPS_KEY, value);
	}
}

export async function getCollapsedGroups<T>(
	persistenceManager: PersistenceManager
): Promise<T[]> {
	// Try new storage first
	const newValue = await persistenceManager.get<T[]>(COLLAPSED_GROUPS_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_COLLAPSED_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T[];
		// Migrate to new storage
		await persistenceManager.set(COLLAPSED_GROUPS_KEY, value);
		return value;
	}

	return [];
}

export async function setCollapsedGroups<T>(
	persistenceManager: PersistenceManager,
	value: T[]
): Promise<void> {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_COLLAPSED_GROUPS_KEY, JSON.stringify(value));
	await persistenceManager.set(COLLAPSED_GROUPS_KEY, value);
}

// Nonephemeral Tabs migrations
export async function migrateNonephemeralTabs(
	persistenceManager: PersistenceManager
): Promise<void> {
	const legacyValue = localStorage.getItem(OBSOLETE_NONEPHEMERAL_TABS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		await persistenceManager.set(NONEPHEMERAL_TABS_KEY, value);
	}
}

export async function getNonephemeralTabs<T>(
	persistenceManager: PersistenceManager
): Promise<T[]> {
	// Try new storage first
	const newValue = await persistenceManager.get<T[]>(NONEPHEMERAL_TABS_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_NONEPHEMERAL_TABS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T[];
		// Migrate to new storage
		await persistenceManager.set(NONEPHEMERAL_TABS_KEY, value);
		return value;
	}

	return [];
}

export async function setNonephemeralTabs<T>(
	persistenceManager: PersistenceManager,
	value: T[]
): Promise<void> {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_NONEPHEMERAL_TABS_KEY, JSON.stringify(value));
	await persistenceManager.set(NONEPHEMERAL_TABS_KEY, value);
}

export async function removeNonephemeralTabs(
	persistenceManager: PersistenceManager
): Promise<void> {
	// Remove from both storages
	localStorage.removeItem(OBSOLETE_NONEPHEMERAL_TABS_KEY);
	await persistenceManager.remove(NONEPHEMERAL_TABS_KEY);
}

// Run all migrations
export async function migrateAllData(
	plugin: ObsidianVerticalTabs
): Promise<void> {
	MigrationContext.initialize(plugin);
	const persistenceManager = plugin.persistenceManager;
	await migrateShowActiveTabs(persistenceManager);
	await migrateSortStrategy(persistenceManager);
	await migrateTempGroupOrder(persistenceManager);
	await migrateViewState(persistenceManager);
	await migrateHiddenGroups(persistenceManager);
	await migrateCollapsedGroups(persistenceManager);
	await migrateNonephemeralTabs(persistenceManager);
}
