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

const SHOW_ACTIVE_TABS_KEY = "show-active-tabs";

export function getShowActiveTabs(): boolean {
	const persistenceManager = MigrationContext.getPersistenceManager();
	return (
		persistenceManager.instance.get<boolean>(SHOW_ACTIVE_TABS_KEY) ?? false
	);
}

export function setShowActiveTabs(value: boolean): void {
	const persistenceManager = MigrationContext.getPersistenceManager();
	persistenceManager.instance.set(SHOW_ACTIVE_TABS_KEY, value);
}

export function initializeMigrationContext(
	plugin: ObsidianVerticalTabs
): void {
	MigrationContext.initialize(plugin);
}
