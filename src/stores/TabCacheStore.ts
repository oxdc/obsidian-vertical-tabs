import { App, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { getTabs } from "src/services/GetTabs";
import { SortStrategy, sortTabs, sortStrategies } from "src/services/SortTabs";
import { GroupType, Identifier } from "../models/VTWorkspace";
import { useStoreWithActions } from "../models/StoreWithActions";
import { metadataService as ms } from "./TabMetadataService";
import {
	TabMetadata,
	GroupMetadata,
	TabUpdates,
	GroupUpdates,
} from "./TabMetadataDB";

export type TabCacheEntry = {
	groupType: GroupType;
	group: WorkspaceParent | null;
	leaves: WorkspaceLeaf[];
	leafIDs: Identifier[];
};

export const createTabCacheEntry = (): TabCacheEntry => ({
	groupType: GroupType.RootSplit,
	group: null,
	leaves: [],
	leafIDs: [],
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
	tabMetadata: Map<Identifier, TabMetadata>;
	groupMetadata: Map<Identifier, GroupMetadata>;
	app: App | null;
}

interface TabCacheActions {
	refresh: (app: App) => void;
	swapGroup: (source: Identifier, target: Identifier) => void;
	moveGroupToEnd: (id: Identifier) => void;
	setSortStrategy: (strategy: SortStrategy | null) => void;
	sort: () => void;
	hasOnlyOneGroup: () => boolean;
	loadTabMetadata: (id: Identifier) => Promise<void>;
	saveTabMetadata: (id: Identifier, updates: TabUpdates) => Promise<void>;
	deleteTabMetadata: (id: Identifier) => Promise<void>;
	loadGroupMetadata: (id: Identifier) => Promise<void>;
	saveGroupMetadata: (id: Identifier, updates: GroupUpdates) => Promise<void>;
	deleteGroupMetadata: (id: Identifier) => Promise<void>;
	loadAllVisibleMetadata: () => Promise<void>;
	cleanupStaleMetadata: () => Promise<void>;
}

type TabCacheStore = TabCacheState & {
	actions: TabCacheActions;
};

const SORT_STRATEGY_KEY = "vertical-tabs:sort-strategy";
const GROUP_ORDER_KEY = "vertical-tabs:group-order";

const saveSortStrategy = (app: App, strategy: SortStrategy | null) => {
	const name =
		Object.keys(sortStrategies).find(
			(key) => sortStrategies[key] === strategy
		) ?? "none";
	app.saveLocalStorage(SORT_STRATEGY_KEY, name);
};

const loadSortStrategy = (app: App): SortStrategy | null => {
	const stored = app.loadLocalStorage(SORT_STRATEGY_KEY);
	const name = (typeof stored === "string" ? stored : null) ?? "none";
	return (name in sortStrategies ? sortStrategies[name] : null) ?? null;
};

const saveGroupOrder = (app: App, groupIDs: Identifier[]) => {
	app.saveLocalStorage(GROUP_ORDER_KEY, JSON.stringify(groupIDs));
};

const loadGroupOrder = (app: App): Identifier[] => {
	const stored = app.loadLocalStorage(GROUP_ORDER_KEY);
	if (typeof stored !== "string") return [];
	try {
		return JSON.parse(stored);
	} catch {
		return [];
	}
};

export const tabCacheStore = useStoreWithActions<TabCacheStore>((set, get) => ({
	content: createNewTabCache(),
	groupIDs: [],
	leafIDs: [],
	leafToGroupMap: new Map(),
	sortStrategy: null,
	tabMetadata: new Map(),
	groupMetadata: new Map(),
	app: null,
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
				const unsortedGroupIDs = [...existingGroupIDs, ...newGroupIDs];
				const loadedGroupIDs = loadGroupOrder(app);
				const sortedGroupIDs = ([] as Identifier[])
					.concat(loadedGroupIDs)
					.filter((id) => unsortedGroupIDs.includes(id))
					.concat(
						unsortedGroupIDs.filter(
							(id) => !loadedGroupIDs.includes(id)
						)
					);
				saveGroupOrder(app, sortedGroupIDs);

				const sortStrategy =
					state.sortStrategy ?? loadSortStrategy(app);

				return {
					...state,
					content,
					leafIDs,
					leafToGroupMap,
					groupIDs: sortedGroupIDs,
					sortStrategy,
					app,
				};
			});
			get().actions.loadAllVisibleMetadata();
		},
		swapGroup: (source, target) => {
			const { groupIDs, app } = get();
			if (!app) return;
			const sourceIndex = groupIDs.indexOf(source);
			const targetIndex = groupIDs.indexOf(target);
			const newGroupIDs = [...groupIDs];
			newGroupIDs[sourceIndex] = target;
			newGroupIDs[targetIndex] = source;
			set({ groupIDs: newGroupIDs });
			saveGroupOrder(app, newGroupIDs);
		},
		moveGroupToEnd: (id) => {
			const { groupIDs, app } = get();
			if (!app) return;
			const newGroupIDs = [...groupIDs];
			const index = newGroupIDs.indexOf(id);
			newGroupIDs.splice(index, 1);
			newGroupIDs.push(id);
			set({ groupIDs: newGroupIDs });
			saveGroupOrder(app, newGroupIDs);
		},
		setSortStrategy: (strategy) => {
			const { app } = get();
			if (app) {
				saveSortStrategy(app, strategy);
			}
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
		loadTabMetadata: async (id) => {
			const metadata = await ms.getTabMetadata(id);
			if (!metadata) return;
			set((state) => ({
				tabMetadata: new Map(state.tabMetadata).set(id, metadata),
			}));
		},
		saveTabMetadata: async (id, updates) => {
			const metadata = await ms.setTabMetadata(id, updates);
			if (!metadata) return;
			set((state) => ({
				tabMetadata: new Map(state.tabMetadata).set(id, metadata),
			}));
		},
		deleteTabMetadata: async (id) => {
			await ms.deleteTabMetadata(id);
			set((state) => {
				if (!state.tabMetadata.has(id)) return state;
				const newMap = new Map(state.tabMetadata);
				newMap.delete(id);
				return { ...state, tabMetadata: newMap };
			});
		},
		loadGroupMetadata: async (id) => {
			const metadata = await ms.getGroupMetadata(id);
			if (!metadata) return;
			set((state) => ({
				groupMetadata: new Map(state.groupMetadata).set(id, metadata),
			}));
		},
		saveGroupMetadata: async (id, updates) => {
			const metadata = await ms.setGroupMetadata(id, updates);
			if (!metadata) return;
			set((state) => ({
				groupMetadata: new Map(state.groupMetadata).set(id, metadata),
			}));
		},
		deleteGroupMetadata: async (id) => {
			await ms.deleteGroupMetadata(id);
			set((state) => {
				if (!state.groupMetadata.has(id)) return state;
				const newMap = new Map(state.groupMetadata);
				newMap.delete(id);
				return { ...state, groupMetadata: newMap };
			});
		},
		loadAllVisibleMetadata: async () => {
			const { leafIDs, groupIDs } = get();
			const [tabMetadataMap, groupMetadataMap] = await Promise.all([
				ms.batchGetTabMetadata(leafIDs),
				ms.batchGetGroupMetadata(groupIDs),
			]);
			set({
				tabMetadata: new Map(tabMetadataMap),
				groupMetadata: new Map(groupMetadataMap),
			});
		},
		cleanupStaleMetadata: async () => {
			const { leafIDs, groupIDs } = get();
			await Promise.all([
				ms.cleanupStaleTabMetadata(leafIDs),
				ms.cleanupStaleGroupMetadata(groupIDs),
			]);
		},
	},
}));
