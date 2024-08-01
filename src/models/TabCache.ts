import { App } from "obsidian";
import * as VT from "./VTWorkspace";
import { create } from "zustand";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { getTabs } from "src/services/GetTabs";

export type TabCacheEntry = {
	groupType: VT.GroupType;
	leaves: VT.WorkspaceLeaf[];
};

export const createTabCacheEntry = (): TabCacheEntry => ({
	groupType: VT.GroupType.RootSplit,
	leaves: [],
});

const factory = () => createTabCacheEntry();

export type TabCache = DefaultRecord<VT.Identifier, TabCacheEntry>;
export const createNewTabCache = () => new DefaultRecord(factory) as TabCache;

interface TabCacheStore {
	tabs: TabCache;
	clear: () => void;
	refresh: (app: App) => void;
}

export const useTabCache = create<TabCacheStore>((set) => ({
	tabs: createNewTabCache(),
	clear: () => set((state) => (state.tabs = createNewTabCache())),
	refresh: (app) => set((state) => (state.tabs = getTabs(app))),
}));

export const REFRESH_TIMEOUT = 10;
