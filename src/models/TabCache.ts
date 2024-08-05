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
};

export const createTabCacheEntry = (): TabCacheEntry => ({
	groupType: VT.GroupType.RootSplit,
	group: null,
	leaves: [],
});

const factory = () => createTabCacheEntry();

export type TabCache = DefaultRecord<VT.Identifier, TabCacheEntry>;
export const createNewTabCache = () => new DefaultRecord(factory) as TabCache;

interface TabCacheStore {
	tabs: TabCache;
	sortStrategy: SortStrategy | null;
	clear: () => void;
	refresh: (app: App) => void;
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

export const useTabCache = create<TabCacheStore>((set, get) => ({
	tabs: createNewTabCache(),
	sortStrategy: null,
	clear: () => set({ tabs: createNewTabCache() }),
	refresh: (app) => set({ tabs: getTabs(app) }),
	setSortStrategy: (strategy) => {
		set({ sortStrategy: strategy });
		get().sort();
	},
	sort: () => {
		const { tabs, sortStrategy } = get();
		const newTabs = createNewTabCache();
		if (!sortStrategy) return;
		for (const key of tabs.keys()) {
			const entry = tabs.get(key);
			newTabs.set(key, entry);
			const group =
				entry.group ||
				(entry.leaves.length > 0 ? entry.leaves[0].parent : null);
			if (group) newTabs.get(key).leaves = sortTabs(group, sortStrategy);
		}
		set({ tabs: newTabs });
	},
}));

export const REFRESH_TIMEOUT = 10;
