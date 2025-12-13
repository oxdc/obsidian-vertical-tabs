import { App, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { getTabs } from "src/services/GetTabs";
import { SortStrategy, sortTabs } from "src/services/SortTabs";
import { GroupType, Identifier } from "../models/VTWorkspace";
import { useStoreWithActions } from "../models/StoreWithActions";
import { metadataService } from "./TabMetadataService";

export interface CustomMetadata {
	color?: string;
	icon?: string;
	customTitle?: string;
}

export type TabCacheEntry = {
	groupType: GroupType;
	group: WorkspaceParent | null;
	leaves: WorkspaceLeaf[];
	leafIDs: Identifier[];
	customMetadata?: Map<Identifier, CustomMetadata>;
};

export const createTabCacheEntry = (): TabCacheEntry => ({
	groupType: GroupType.RootSplit,
	group: null,
	leaves: [],
	leafIDs: [],
	customMetadata: new Map(),
});

const factory = () => createTabCacheEntry();

export type TabCache = DefaultRecord<Identifier, TabCacheEntry>;
export const createNewTabCache = () => new DefaultRecord(factory) as TabCache;

interface TabCacheState {
	content: TabCache;
	groupIDs: Identifier[];
	leafIDs: Identifier[];
	leafToGroupMap: Map<Identifier, Identifier>;
	sortStrategy: SortStrategy | null;
	groupCustomMetadata: Map<Identifier, CustomMetadata>;
}

interface TabCacheActions {
	refresh: (app: App) => void;
	swapGroup: (source: Identifier, target: Identifier) => void;
	moveGroupToEnd: (groupID: Identifier) => void;
	setSortStrategy: (strategy: SortStrategy | null) => void;
	sort: () => void;
	hasOnlyOneGroup: () => boolean;
	loadCustomMetadata: (leafID: Identifier) => Promise<void>;
	saveCustomMetadata: (
		leafID: Identifier,
		metadata: CustomMetadata
	) => Promise<void>;
	deleteCustomMetadata: (leafID: Identifier) => Promise<void>;
	loadGroupMetadata: (groupID: Identifier) => Promise<void>;
	saveGroupMetadata: (
		groupID: Identifier,
		metadata: CustomMetadata
	) => Promise<void>;
	deleteGroupMetadata: (groupID: Identifier) => Promise<void>;
	loadAllVisibleMetadata: () => Promise<void>;
	cleanupStaleMetadata: () => Promise<void>;
}

type TabCacheStore = TabCacheState & {
	actions: TabCacheActions;
};

export const tabCacheStore = useStoreWithActions<TabCacheStore>((set, get) => ({
	content: createNewTabCache(),
	groupIDs: [],
	leafIDs: [],
	leafToGroupMap: new Map(),
	sortStrategy: null,
	groupCustomMetadata: new Map(),
	actions: {
		refresh: (app) => {
			set((state) => {
				const content = getTabs(app);
				const leafIDs: Identifier[] = [];
				const leafToGroupMap = new Map<Identifier, Identifier>();

				for (const [groupID, entry] of content.entries()) {
					for (const leafID of entry.leafIDs) {
						leafIDs.push(leafID);
						leafToGroupMap.set(leafID, groupID);
					}
				}

				const existingGroupIDs = state.groupIDs.filter((id) =>
					content.has(id)
				);
				const newGroupIDs = Array.from(content.keys()).filter(
					(id) => !existingGroupIDs.includes(id)
				);
				const sortedGroupIDs = [...existingGroupIDs, ...newGroupIDs];

				return {
					...state,
					content,
					leafIDs,
					leafToGroupMap,
					groupIDs: sortedGroupIDs,
				};
			});
			get().actions.loadAllVisibleMetadata();
		},
		swapGroup: (source, target) => {
			const { groupIDs } = get();
			const sourceIndex = groupIDs.indexOf(source);
			const targetIndex = groupIDs.indexOf(target);
			const newGroupIDs = [...groupIDs];
			newGroupIDs[sourceIndex] = target;
			newGroupIDs[targetIndex] = source;
			set({ groupIDs: newGroupIDs });
		},
		moveGroupToEnd: (groupID) => {
			const { groupIDs } = get();
			const newGroupIDs = [...groupIDs];
			const index = newGroupIDs.indexOf(groupID);
			newGroupIDs.splice(index, 1);
			newGroupIDs.push(groupID);
			set({ groupIDs: newGroupIDs });
		},
		setSortStrategy: (strategy) => {
			set({ sortStrategy: strategy });
			get().actions.sort();
		},
		sort: () => {
			const { content, sortStrategy } = get();
			if (!sortStrategy) return;
			const newTabs = createNewTabCache();
			for (const key of content.keys()) {
				const entry = content.get(key);
				newTabs.set(key, entry);
				if (entry.groupType === GroupType.RootSplit) {
					const group =
						entry.group ||
						(entry.leaves.length > 0
							? entry.leaves[0].parent
							: null);
					if (group) {
						newTabs.get(key).leaves = sortTabs(group, sortStrategy);
					}
				}
			}
			set({ content: newTabs });
		},
		hasOnlyOneGroup: () => {
			const { groupIDs } = get();
			const rootGroupIDs = groupIDs.filter(
				(id) => !id.endsWith("-sidebar")
			);
			return rootGroupIDs.length === 1;
		},
		loadCustomMetadata: async (leafID) => {
			const metadata = await metadataService.getTabMetadata(leafID);
			if (!metadata) return;

			set((state) => {
				const groupID = state.leafToGroupMap.get(leafID);
				if (!groupID) return state;

				const entry = state.content.get(groupID);
				if (!entry.leafIDs.includes(leafID)) return state;

				const customMetadata = new Map(entry.customMetadata);
				customMetadata.set(leafID, {
					color: metadata.color,
					icon: metadata.icon,
					customTitle: metadata.customTitle,
				});

				const newContent = new DefaultRecord<Identifier, TabCacheEntry>(
					() => createTabCacheEntry(),
					Array.from(state.content.entries())
				);
				newContent.set(groupID, { ...entry, customMetadata });

				return { ...state, content: newContent };
			});
		},
		saveCustomMetadata: async (leafID, metadata) => {
			await metadataService.setTabMetadata(leafID, metadata);

			set((state) => {
				const groupID = state.leafToGroupMap.get(leafID);
				if (!groupID) return state;

				const entry = state.content.get(groupID);
				if (!entry.leafIDs.includes(leafID)) return state;

				const customMetadata = new Map(entry.customMetadata);
				customMetadata.set(leafID, metadata);

				const newContent = new DefaultRecord<Identifier, TabCacheEntry>(
					() => createTabCacheEntry(),
					Array.from(state.content.entries())
				);
				newContent.set(groupID, { ...entry, customMetadata });

				return { ...state, content: newContent };
			});
		},
		deleteCustomMetadata: async (leafID) => {
			await metadataService.deleteTabMetadata(leafID);

			set((state) => {
				const groupID = state.leafToGroupMap.get(leafID);
				if (!groupID) return state;

				const entry = state.content.get(groupID);
				if (!entry.customMetadata?.has(leafID)) return state;

				const customMetadata = new Map(entry.customMetadata);
				customMetadata.delete(leafID);

				const newContent = new DefaultRecord<Identifier, TabCacheEntry>(
					() => createTabCacheEntry(),
					Array.from(state.content.entries())
				);
				newContent.set(groupID, { ...entry, customMetadata });

				return { ...state, content: newContent };
			});
		},
		loadGroupMetadata: async (groupID) => {
			const metadata = await metadataService.getGroupMetadata(groupID);
			if (metadata) {
				set((state) => {
					const newMap = new Map(state.groupCustomMetadata);
					newMap.set(groupID, {
						color: metadata.color,
						icon: metadata.icon,
						customTitle: metadata.customTitle,
					});
					return { ...state, groupCustomMetadata: newMap };
				});
			}
		},
		saveGroupMetadata: async (groupID, metadata) => {
			await metadataService.setGroupMetadata(groupID, metadata);
			set((state) => {
				const newMap = new Map(state.groupCustomMetadata);
				newMap.set(groupID, metadata);
				return { ...state, groupCustomMetadata: newMap };
			});
		},
		deleteGroupMetadata: async (groupID) => {
			await metadataService.deleteGroupMetadata(groupID);
			set((state) => {
				const newMap = new Map(state.groupCustomMetadata);
				newMap.delete(groupID);
				return { ...state, groupCustomMetadata: newMap };
			});
		},
		loadAllVisibleMetadata: async () => {
			const { leafIDs, groupIDs } = get();

			const [tabMetadataMap, groupMetadataMap] = await Promise.all([
				metadataService.batchGetTabMetadata(leafIDs),
				metadataService.batchGetGroupMetadata(groupIDs),
			]);

			set((state) => {
				const newContent = new DefaultRecord<Identifier, TabCacheEntry>(
					() => createTabCacheEntry(),
					Array.from(state.content.entries())
				);

				for (const [groupID, entry] of state.content.entries()) {
					const customMetadata = new Map<
						Identifier,
						CustomMetadata
					>();
					for (const leafID of entry.leafIDs) {
						const metadata = tabMetadataMap.get(leafID);
						if (metadata) {
							customMetadata.set(leafID, {
								color: metadata.color,
								icon: metadata.icon,
								customTitle: metadata.customTitle,
							});
						}
					}
					if (customMetadata.size > 0) {
						newContent.set(groupID, { ...entry, customMetadata });
					}
				}

				const newGroupMetadata = new Map<Identifier, CustomMetadata>();
				for (const [groupID, metadata] of groupMetadataMap.entries()) {
					newGroupMetadata.set(groupID, {
						color: metadata.color,
						icon: metadata.icon,
						customTitle: metadata.customTitle,
					});
				}

				return {
					...state,
					content: newContent,
					groupCustomMetadata: newGroupMetadata,
				};
			});
		},
		cleanupStaleMetadata: async () => {
			const { leafIDs, groupIDs } = get();
			await Promise.all([
				metadataService.cleanupStaleTabMetadata(leafIDs),
				metadataService.cleanupStaleGroupMetadata(groupIDs),
			]);
		},
	},
}));
