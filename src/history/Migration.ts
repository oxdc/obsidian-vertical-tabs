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

export function migrateShowActiveTabs(
	persistenceManager: PersistenceManager
): void {
	const legacyValue = localStorage.getItem(OBSOLETE_SHOW_ACTIVE_TABS_KEY);
	if (legacyValue !== null) {
		const value = legacyValue === "true";
		persistenceManager.instance.set(SHOW_ACTIVE_TABS_KEY, value);
	}
}

export function getShowActiveTabs(): boolean {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Try new storage first
	const newValue =
		persistenceManager.instance.get<boolean>(SHOW_ACTIVE_TABS_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_SHOW_ACTIVE_TABS_KEY);
	if (legacyValue !== null) {
		const value = legacyValue === "true";
		// Migrate to new storage
		persistenceManager.instance.set(SHOW_ACTIVE_TABS_KEY, value);
		return value;
	}

	return false;
}

export function setShowActiveTabs(value: boolean): void {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_SHOW_ACTIVE_TABS_KEY, value.toString());
	persistenceManager.instance.set(SHOW_ACTIVE_TABS_KEY, value);
}

export function migrateSortStrategy(
	persistenceManager: PersistenceManager
): void {
	const legacyValue = localStorage.getItem(OBSOLETE_SORT_STRATEGY_KEY);
	if (legacyValue !== null) {
		persistenceManager.instance.set(SORT_STRATEGY_KEY, legacyValue);
	}
}

export function getSortStrategy(): string {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Try new storage first
	const newValue = persistenceManager.instance.get<string>(SORT_STRATEGY_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_SORT_STRATEGY_KEY);
	if (legacyValue !== null) {
		// Migrate to new storage
		persistenceManager.instance.set(SORT_STRATEGY_KEY, legacyValue);
		return legacyValue;
	}

	return "none";
}

export function setSortStrategy(value: string): void {
	const persistenceManager = MigrationContext.getPersistenceManager();
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_SORT_STRATEGY_KEY, value);
	persistenceManager.instance.set(SORT_STRATEGY_KEY, value);
}

export function migrateGroupOrder(
	persistenceManager: PersistenceManager
): void {
	const legacyValue = localStorage.getItem(OBSOLETE_TEMP_GROUP_ORDER_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		persistenceManager.instance.set(TEMP_GROUP_ORDER_KEY, value);
	}
}

export function getGroupOrder(
	persistenceManager: PersistenceManager
): string[] {
	// Try new storage first
	const newValue =
		persistenceManager.instance.get<string[]>(TEMP_GROUP_ORDER_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_TEMP_GROUP_ORDER_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		// Migrate to new storage
		persistenceManager.instance.set(TEMP_GROUP_ORDER_KEY, value);
		return value;
	}

	return [];
}

export function setGroupOrder(
	persistenceManager: PersistenceManager,
	value: string[]
): void {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_TEMP_GROUP_ORDER_KEY, JSON.stringify(value));
	persistenceManager.instance.set(TEMP_GROUP_ORDER_KEY, value);
}

// ViewState migrations
export function migrateViewState(persistenceManager: PersistenceManager): void {
	const legacyValue = localStorage.getItem(OBSOLETE_VIEW_STATE_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		persistenceManager.instance.set(VIEW_STATE_KEY, value);
	}
}

export function getViewState<T>(
	persistenceManager: PersistenceManager
): T | null {
	// Try new storage first
	const newValue = persistenceManager.instance.get<T>(VIEW_STATE_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_VIEW_STATE_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T;
		// Migrate to new storage
		persistenceManager.instance.set(VIEW_STATE_KEY, value);
		return value;
	}

	return null;
}

export function setViewState<T>(
	persistenceManager: PersistenceManager,
	value: T
): void {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_VIEW_STATE_KEY, JSON.stringify(value));
	persistenceManager.instance.set(VIEW_STATE_KEY, value);
}

// Hidden Groups migrations
export function migrateHiddenGroups(
	persistenceManager: PersistenceManager
): void {
	const legacyValue = localStorage.getItem(OBSOLETE_HIDDEN_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		persistenceManager.instance.set(HIDDEN_GROUPS_KEY, value);
	}
}

export function getHiddenGroups<T>(
	persistenceManager: PersistenceManager
): T[] {
	// Try new storage first
	const newValue = persistenceManager.instance.get<T[]>(HIDDEN_GROUPS_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_HIDDEN_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T[];
		// Migrate to new storage
		persistenceManager.instance.set(HIDDEN_GROUPS_KEY, value);
		return value;
	}

	return [];
}

export function setHiddenGroups<T>(
	persistenceManager: PersistenceManager,
	value: T[]
): void {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_HIDDEN_GROUPS_KEY, JSON.stringify(value));
	persistenceManager.instance.set(HIDDEN_GROUPS_KEY, value);
}

// Collapsed Groups migrations
export function migrateCollapsedGroups(
	persistenceManager: PersistenceManager
): void {
	const legacyValue = localStorage.getItem(OBSOLETE_COLLAPSED_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		persistenceManager.instance.set(COLLAPSED_GROUPS_KEY, value);
	}
}

export function getCollapsedGroups<T>(
	persistenceManager: PersistenceManager
): T[] {
	// Try new storage first
	const newValue = persistenceManager.instance.get<T[]>(COLLAPSED_GROUPS_KEY);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_COLLAPSED_GROUPS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T[];
		// Migrate to new storage
		persistenceManager.instance.set(COLLAPSED_GROUPS_KEY, value);
		return value;
	}

	return [];
}

export function setCollapsedGroups<T>(
	persistenceManager: PersistenceManager,
	value: T[]
): void {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_COLLAPSED_GROUPS_KEY, JSON.stringify(value));
	persistenceManager.instance.set(COLLAPSED_GROUPS_KEY, value);
}

// Nonephemeral Tabs migrations
export function migrateNonephemeralTabs(
	persistenceManager: PersistenceManager
): void {
	const legacyValue = localStorage.getItem(OBSOLETE_NONEPHEMERAL_TABS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue);
		persistenceManager.instance.set(NONEPHEMERAL_TABS_KEY, value);
	}
}

export function getNonephemeralTabs<T>(
	persistenceManager: PersistenceManager
): T[] {
	// Try new storage first
	const newValue = persistenceManager.instance.get<T[]>(
		NONEPHEMERAL_TABS_KEY
	);
	if (newValue !== null) {
		return newValue;
	}

	// Fall back to legacy storage
	const legacyValue = localStorage.getItem(OBSOLETE_NONEPHEMERAL_TABS_KEY);
	if (legacyValue !== null) {
		const value = JSON.parse(legacyValue) as T[];
		// Migrate to new storage
		persistenceManager.instance.set(NONEPHEMERAL_TABS_KEY, value);
		return value;
	}

	return [];
}

export function setNonephemeralTabs<T>(
	persistenceManager: PersistenceManager,
	value: T[]
): void {
	// Update both storages for graceful migration
	localStorage.setItem(OBSOLETE_NONEPHEMERAL_TABS_KEY, JSON.stringify(value));
	persistenceManager.instance.set(NONEPHEMERAL_TABS_KEY, value);
}

export function removeNonephemeralTabs(
	persistenceManager: PersistenceManager
): void {
	// Remove from both storages
	localStorage.removeItem(OBSOLETE_NONEPHEMERAL_TABS_KEY);
	persistenceManager.instance.remove(NONEPHEMERAL_TABS_KEY);
}

// Run all migrations
export function migrateAllData(plugin: ObsidianVerticalTabs): void {
	MigrationContext.initialize(plugin);
	const persistenceManager = plugin.persistenceManager;
	migrateShowActiveTabs(persistenceManager);
	migrateSortStrategy(persistenceManager);
	migrateGroupOrder(persistenceManager);
	// migrateViewState(persistenceManager);
	// migrateHiddenGroups(persistenceManager);
	// migrateCollapsedGroups(persistenceManager);
	// migrateNonephemeralTabs(persistenceManager);
}
