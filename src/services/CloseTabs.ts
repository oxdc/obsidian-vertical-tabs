import { App } from "obsidian";
import * as VT from "../models/VTWorkspace";

export function closeOthersInGroup(app: App, leaf: VT.WorkspaceLeaf) {
	const parent = leaf.parent;
	parent.children = [leaf];
	parent.selectTab(leaf);
	(app.workspace as VT.Workspace).onLayoutChange();
}

export function closeTabsToTopInGroup(app: App, leaf: VT.WorkspaceLeaf) {
	const parent = leaf.parent;
	const index = parent.children.indexOf(leaf);
	parent.children = parent.children.slice(index);
	parent.selectTab(leaf);
	(app.workspace as VT.Workspace).onLayoutChange();
}

export function closeTabsToBottomInGroup(app: App, leaf: VT.WorkspaceLeaf) {
	const parent = leaf.parent;
	const index = parent.children.indexOf(leaf);
	parent.children = parent.children.slice(0, index + 1);
	parent.selectTab(leaf);
	(app.workspace as VT.Workspace).onLayoutChange();
}

export function closeAllTabsInGroup(app: App, leaf: VT.WorkspaceLeaf) {
  
  (app.workspace as VT.Workspace).onLayoutChange();
}