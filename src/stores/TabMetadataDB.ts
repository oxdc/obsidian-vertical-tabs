import { Database, Table } from "src/stores/IndexedDBWrapper";
import { Identifier } from "src/models/VTWorkspace";
import { App } from "obsidian";

export interface TabMetadata {
	id: Identifier;
	color?: string;
	icon?: string;
	title?: string;
}

export interface GroupMetadata {
	id: Identifier;
	color?: string;
	icon?: string;
	title?: string;
}

export const DB_STORE_NAMES = ["tabMetadata", "groupMetadata"] as const;

export function getDBName(app: App): string {
	return `VerticalTabsMetadata-${app.appId}`;
}

export type VaultDB = Database & {
	tabMetadata: Table<TabMetadata>;
	groupMetadata: Table<GroupMetadata>;
};

export function createDB(app: App): VaultDB {
	const dbInstance = new Database(getDBName(app));
	dbInstance.version(1).stores({
		tabMetadata: "id",
		groupMetadata: "id",
	});
	return dbInstance as VaultDB;
}

export type Metadata = TabMetadata | GroupMetadata;
export type PartialMetadata<T extends Metadata> = Partial<Omit<T, "id">>;
export type TabUpdates = PartialMetadata<TabMetadata>;
export type GroupUpdates = PartialMetadata<GroupMetadata>;
export type TabMetadataMap = Map<Identifier, TabMetadata>;
export type GroupMetadataMap = Map<Identifier, GroupMetadata>;
export type TabResult = Promise<TabMetadata | undefined>;
export type GroupResult = Promise<GroupMetadata | undefined>;
