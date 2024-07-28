import { App } from "obsidian";
import * as VT from "./VTWorkspace";
import { create } from "zustand";
import { DefaultRecord } from "src/utils/DefaultRecord";

export type TabCache = DefaultRecord<VT.Identifier, VT.WorkspaceLeaf[]>;
export const createNewTabCache = () => new DefaultRecord(() => []) as TabCache;

interface TabCacheStore {
	tabs: TabCache;
	clear: () => void;
	refresh: (app: App) => void;
}

export const useTabCache = create<TabCacheStore>((set) => ({
	tabs: createNewTabCache(),
	clear: () => set((state) => (state.tabs = createNewTabCache())),
	refresh: (app: App) =>
		set((state) => (state.tabs = refresh(app, createNewTabCache()))),
}));

function refresh(app: App, tabs: TabCache): TabCache {
	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.leftSplit,
		(leaf) => {
			tabs.get("left-sidedock")?.push(leaf);
		}
	);
	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rightSplit,
		(leaf) => {
			tabs.get("right-sidedock")?.push(leaf);
		}
	);
	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rootSplit,
		(leaf) => {
			const parent = leaf.parent as VT.WorkspaceParent;
			tabs.get(parent.id)?.push(leaf);
		}
	);
	console.log(tabs);
	return tabs;
}
