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

export const SAFE_DETACH_TIMEOUT = 1000;

export function safeDetach(leaf: WorkspaceLeaf) {
	if (leaf.view instanceof FileView) {
		leaf.view.isDetachingFromVT = true;
	}
	try {
		leaf.detach();
	} catch {
		// ignore
		// Detaching Bases during tab deduplication will cause an error,
		// which is safe to ignore. Potentially a bug in Obsidian v1.9.
		// We would never reach the wrapped method `FileView.prototype.close`
		// at this point.
	}
}
