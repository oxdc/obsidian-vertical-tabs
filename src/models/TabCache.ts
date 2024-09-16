import { App } from "obsidian";
import * as VT from "./VTWorkspace";
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

export type TabCacheEntry = {
	groupType: VT.GroupType;
	group: VT.WorkspaceParent | null;
	leaves: VT.WorkspaceLeaf[];
	leafIDs: VT.Identifier[];
};

export const createTabCacheEntry = (): TabCacheEntry => ({
	groupType: VT.GroupType.RootSplit,
	group: null,
	leaves: [],
	leafIDs: [],
});

const factory = () => createTabCacheEntry();

export type TabCache = DefaultRecord<VT.Identifier, TabCacheEntry>;
export const createNewTabCache = () => new DefaultRecord(factory) as TabCache;

interface TabCacheStore {
	content: TabCache;
	groupIDs: VT.Identifier[];
	leaveIDs: VT.Identifier[];
	sortStrategy: SortStrategy | null;
	clear: () => void;
	refresh: (app: App) => void;
	swapGroup: (source: VT.Identifier, target: VT.Identifier) => void;
	setSortStrategy: (strategy: SortStrategy | null) => void;
	sort: () => void;
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

export const useTabCache = create<TabCacheStore>()((set, get) => ({
	content: createNewTabCache(),
	groupIDs: [],
	leaveIDs: [],
	sortStrategy: loadSortStrategy(),
	clear: () =>
		set({ content: createNewTabCache(), groupIDs: [], leaveIDs: [] }),
	refresh: (app) =>
		set((state) => {
			const content = getTabs(app);
			const leaveIDs = Array.from(content.values()).flatMap(
				(entry) => entry.leafIDs
			);
			const groupIDs = state.groupIDs.filter((id) => content.has(id));
			const newGroupIDs = Array.from(content.keys()).filter(
				(id) => !groupIDs.includes(id)
			);
			return {
				...state,
				content,
				leaveIDs,
				groupIDs: [...groupIDs, ...newGroupIDs],
			};
		}),
	swapGroup: (source, target) => {
		const { groupIDs } = get();
		const sourceIndex = groupIDs.indexOf(source);
		const targetIndex = groupIDs.indexOf(target);
		groupIDs[sourceIndex] = target;
		groupIDs[targetIndex] = source;
		set({ groupIDs });
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
			const group =
				entry.group ||
				(entry.leaves.length > 0 ? entry.leaves[0].parent : null);
			if (group) newTabs.get(key).leaves = sortTabs(group, sortStrategy);
		}
		set({ content: newTabs });
	},
}));

export const REFRESH_TIMEOUT = 10;
