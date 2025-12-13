import Dexie, { Table } from "dexie";
import { Identifier } from "src/models/VTWorkspace";

export interface TabMetadata {
	id: Identifier;
	color?: string;
	icon?: string;
	customTitle?: string;
}

export interface GroupMetadata {
	id: Identifier;
	color?: string;
	icon?: string;
	customTitle?: string;
}

export class MetadataDatabase extends Dexie {
	tabMetadata!: Table<TabMetadata, Identifier>;
	groupMetadata!: Table<GroupMetadata, Identifier>;

	constructor() {
		super("VerticalTabsMetadata");
		this.version(1).stores({
			tabMetadata: "id",
			groupMetadata: "id",
		});
	}
}

export const db = new MetadataDatabase();

export type Metadata = TabMetadata | GroupMetadata;
export type PartialMetadata<T extends Metadata> = Partial<Omit<T, "id">>;
export type TabUpdates = PartialMetadata<TabMetadata>;
export type GroupUpdates = PartialMetadata<GroupMetadata>;
export type TabMetadataMap = Map<Identifier, TabMetadata>;
export type GroupMetadataMap = Map<Identifier, GroupMetadata>;
export type TabResult = Promise<TabMetadata | undefined>;
export type GroupResult = Promise<GroupMetadata | undefined>;
