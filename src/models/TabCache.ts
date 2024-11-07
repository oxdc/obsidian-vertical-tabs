import { App, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { create } from "zustand";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { getTabs } from "src/services/GetTabs";
import {
	byActiveTime,
	byPinned,
	byTitle,
	SortStrategy,
	sortTabs,
} from "src/services/SortTabs";
import { GroupType, Identifier } from "./VTWorkspace";
import { deduplicateExistingTabs } from "src/services/DeduplicateTab";
import { useSettings } from "./PluginContext";
import { useViewState } from "./ViewState";

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

interface TabCacheStore {
	content: TabCache;
	groupIDs: Identifier[];
	leaveIDs: Identifier[];
	sortStrategy: SortStrategy | null;
	clear: () => void;
	refresh: (app: App) => void;
	swapGroup: (source: Identifier, target: Identifier) => void;
	moveGroupToEnd: (groupID: Identifier) => void;
	setSortStrategy: (strategy: SortStrategy | null) => void;
	sort: () => void;
	hasOnlyOneGroup: () => boolean;
}

export const sortStrategies: Record<string, SortStrategy> = {
	titleAToZ: { compareFn: byTitle, reverse: false },
	titleZToA: { compareFn: byTitle, reverse: true },
	pinnedAtTop: { compareFn: byPinned, reverse: false },
	pinnedAtBottom: { compareFn: byPinned, reverse: true },
	recentOnTop: { compareFn: byActiveTime, reverse: false },
	recentOnBottom: { compareFn: byActiveTime, reverse: true },
};

const saveSortStrategy = (strategy: SortStrategy | null) => {
	const name =
		Object.keys(sortStrategies).find(
			(key) => sortStrategies[key] === strategy
		) ?? "none";
	localStorage.setItem("sort-strategy", name);
};

const loadSortStrategy = (): SortStrategy | null => {
	const name = localStorage.getItem("sort-strategy") ?? "none";
	return sortStrategies[name] ?? null;
};

const saveGroupOrder = (groupIDs: Identifier[]) => {
	localStorage.setItem("temp-group-order", JSON.stringify(groupIDs));
};

const loadGroupOrder = (): Identifier[] => {
	const order = localStorage.getItem("temp-group-order");
	return order ? JSON.parse(order) : [];
};

export const useTabCache = create<TabCacheStore>()((set, get) => ({
	content: createNewTabCache(),
	groupIDs: [],
	leaveIDs: [],
	sortStrategy: loadSortStrategy(),
	clear: () =>
		set({ content: createNewTabCache(), groupIDs: [], leaveIDs: [] }),
	refresh: (app) => {
		const deduplicateTabs = useSettings.getState().deduplicateTabs;
		let activeLeaf = null;
		if (deduplicateTabs) activeLeaf = deduplicateExistingTabs(app);
		set((state) => {
			const content = getTabs(app);
			const leaveIDs = Array.from(content.values()).flatMap(
				(entry) => entry.leafIDs
			);
			const groupIDs = state.groupIDs.filter((id) => content.has(id));
			const newGroupIDs = Array.from(content.keys()).filter(
				(id) => !groupIDs.includes(id)
			);
			const unsortedGroupIDs = [...groupIDs, ...newGroupIDs];
			const loadedGroupIDs = loadGroupOrder();
			const sortedGroupIDs = ([] as Identifier[])
				.concat(loadedGroupIDs)
				.filter((id) => unsortedGroupIDs.includes(id))
				.concat(
					unsortedGroupIDs.filter(
						(id) => !loadedGroupIDs.includes(id)
					)
				);
			saveGroupOrder(sortedGroupIDs);
			return {
				...state,
				content,
				leaveIDs,
				groupIDs: sortedGroupIDs,
			};
		});
		if (activeLeaf)
			useViewState.getState().lockFocusOnLeaf(app, activeLeaf);
	},
	swapGroup: (source, target) => {
		const { groupIDs } = get();
		const sourceIndex = groupIDs.indexOf(source);
		const targetIndex = groupIDs.indexOf(target);
		groupIDs[sourceIndex] = target;
		groupIDs[targetIndex] = source;
		set({ groupIDs });
		saveGroupOrder(groupIDs);
	},
	moveGroupToEnd: (groupID) => {
		const { groupIDs } = get();
		const index = groupIDs.indexOf(groupID);
		groupIDs.splice(index, 1);
		groupIDs.push(groupID);
		set({ groupIDs });
		saveGroupOrder(groupIDs);
	},
	setSortStrategy: (strategy) => {
		saveSortStrategy(strategy);
		set({ sortStrategy: strategy });
		get().sort();
	},
	sort: () => {
		const { content, sortStrategy } = get();
		const newTabs = createNewTabCache();
		if (!sortStrategy) return;
		for (const key of content.keys()) {
			const entry = content.get(key);
			newTabs.set(key, entry);
			if (entry.groupType === GroupType.RootSplit) {
				const group =
					entry.group ||
					(entry.leaves.length > 0 ? entry.leaves[0].parent : null);
				if (group)
					newTabs.get(key).leaves = sortTabs(group, sortStrategy);
			}
		}
		set({ content: newTabs });
	},
	hasOnlyOneGroup: () => {
		const { groupIDs } = get();
		const rootGroupIDs = groupIDs.filter((id) => !id.endsWith("-sidebar"));
		return rootGroupIDs.length === 1;
	},
}));

export const REFRESH_TIMEOUT = 10;
