import { App, FileView, WorkspaceLeaf } from "obsidian";

export function closeOthersInGroup(app: App, leaf: WorkspaceLeaf) {
	const parent = leaf.parent;
	parent.children = [leaf];
	parent.selectTab(leaf);
	app.workspace.onLayoutChange();
}

export function closeTabsToTopInGroup(app: App, leaf: WorkspaceLeaf) {
	const parent = leaf.parent;
	const index = parent.children.indexOf(leaf);
	parent.children = parent.children.slice(index);
	parent.selectTab(leaf);
	app.workspace.onLayoutChange();
}

export function closeTabsToBottomInGroup(app: App, leaf: WorkspaceLeaf) {
	const parent = leaf.parent;
	const index = parent.children.indexOf(leaf);
	parent.children = parent.children.slice(0, index + 1);
	parent.selectTab(leaf);
	app.workspace.onLayoutChange();
}

export function closeAllTabsInGroup(app: App, leaf: WorkspaceLeaf) {
	app.workspace.onLayoutChange();
}

export const SAFE_DETACH_TIMEOUT = 1000;

export function safeDetach(leaf: WorkspaceLeaf) {
	if (leaf.view instanceof FileView) {
		leaf.view.isDetachingFromVT = true;
	}
	leaf.detach();
}
