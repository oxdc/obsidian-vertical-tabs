import { App } from "obsidian";
import * as VT from "./VTWorkspace";
import { create } from "zustand";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { getTabs } from "src/services/GetTabs";
import { byTitle, SortStrategy, sortTabs } from "src/services/SortTabs";

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
	setSortStrategy: (app: App, strategy: SortStrategy) => void;
	setSorted: (app: App) => void;
}

export const sortStrategies: Record<string, SortStrategy> = {
	titleAToZ: { compareFn: byTitle, reverse: false },
	titleZToA: { compareFn: byTitle, reverse: true },
	pinnedAtTop: { compareFn: byTitle, reverse: false },
	pinnedAtBottom: { compareFn: byTitle, reverse: true },
	recentOnTop: { compareFn: byTitle, reverse: false },
	recentOnBottom: { compareFn: byTitle, reverse: true },
};

export const useTabCache = create<TabCacheStore>((set, get) => ({
	tabs: createNewTabCache(),
	sortStrategy: null,
	clear: () => set((state) => (state.tabs = createNewTabCache())),
	refresh: (app) => {
		set((state) => (state.tabs = getTabs(app)));
		get().setSorted(app);
	},
	setSortStrategy: (app: App, strategy: SortStrategy) => {
		set({ sortStrategy: strategy });
		get().setSorted(app);
	},
	setSorted: (app: App) => {
		const { tabs, sortStrategy } = get();
		if (!sortStrategy) return;
		for (const key of tabs.keys()) {
			const entry = tabs.get(key);
			const group =
				entry.group ||
				(entry.leaves.length > 0 ? entry.leaves[0].parent : null);
			if (group) sortTabs(group, sortStrategy);
		}
		(app.workspace as VT.Workspace).onLayoutChange();
	},
}));

export const REFRESH_TIMEOUT = 10;
