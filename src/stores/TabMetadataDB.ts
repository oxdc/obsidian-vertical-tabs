import { Database, Table } from "src/stores/IndexedDBWrapper";
import { Identifier } from "src/models/VTWorkspace";

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

const dbInstance = new Database("VerticalTabsMetadata");
dbInstance.version(1).stores({
	tabMetadata: "id",
	groupMetadata: "id",
});

export const db = dbInstance as Database & {
	tabMetadata: Table<TabMetadata>;
	groupMetadata: Table<GroupMetadata>;
};

export type Metadata = TabMetadata | GroupMetadata;
export type PartialMetadata<T extends Metadata> = Partial<Omit<T, "id">>;
export type TabUpdates = PartialMetadata<TabMetadata>;
export type GroupUpdates = PartialMetadata<GroupMetadata>;
export type TabMetadataMap = Map<Identifier, TabMetadata>;
export type GroupMetadataMap = Map<Identifier, GroupMetadata>;
export type TabResult = Promise<TabMetadata | undefined>;
export type GroupResult = Promise<GroupMetadata | undefined>;
