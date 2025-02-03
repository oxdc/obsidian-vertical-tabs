import { App, FileView, TFile, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { createNewTabCache, TabCache } from "src/models/TabCache";
import { GroupType } from "src/models/VTWorkspace";
import { managedLeafStore } from "src/stores/ManagedLeafStore";

function record(
	app: App,
	nameOrID: string,
	type: GroupType,
	leaf: WorkspaceLeaf,
	content: TabCache
) {
	const { isManagedLeaf } = managedLeafStore.getActions();
	if (isManagedLeaf(app, leaf)) return;
	content.get(nameOrID).groupType = type;
	content.get(nameOrID).group = leaf.parent as WorkspaceParent;
	content.get(nameOrID).leaves.push(leaf);
	content.get(nameOrID).leafIDs.push(leaf.id);
	// If guessedCreationTime is not set, we assume the leaf was created now
	if (!leaf.guessedCreationTime) {
		leaf.guessedCreationTime = Date.now();
	}
}

export function getTabs(app: App): TabCache {
	const content = createNewTabCache();
	const workspace = app.workspace;
	const { leftSplit, rightSplit, rootSplit, floatingSplit } = workspace;
	managedLeafStore.getActions().refresh(app);
	workspace.iterateLeaves(leftSplit, (leaf) =>
		record(app, "left-sidebar", GroupType.LeftSidebar, leaf, content)
	);
	workspace.iterateLeaves(rightSplit, (leaf) =>
		record(app, "right-sidebar", GroupType.RightSidebar, leaf, content)
	);
	workspace.iterateLeaves(rootSplit, (leaf) =>
		record(app, leaf.parent.id, GroupType.RootSplit, leaf, content)
	);
	workspace.iterateLeaves(floatingSplit, (leaf) =>
		record(app, leaf.parent.id, GroupType.RootSplit, leaf, content)
	);
	return content;
}

export function iterateRootOrFloatingLeaves(
	app: App,
	callback: (leaf: WorkspaceLeaf) => void
) {
	const workspace = app.workspace;
	const { rootSplit, floatingSplit } = workspace;
	workspace.iterateLeaves(rootSplit, callback);
	workspace.iterateLeaves(floatingSplit, callback);
}

export function iterateSidebarLeaves(
	app: App,
	callback: (leaf: WorkspaceLeaf) => void
) {
	const workspace = app.workspace;
	const { leftSplit, rightSplit } = workspace;
	workspace.iterateLeaves(leftSplit, callback);
	workspace.iterateLeaves(rightSplit, callback);
}

export function getOpenFileOfLeaf(app: App, leaf: WorkspaceLeaf): TFile | null {
	if (leaf.view instanceof FileView) return leaf.view.file;
	const path = leaf.getViewState().state?.file as string | undefined;
	if (path) {
		const file = app.vault.getAbstractFileByPath(path);
		if (file instanceof TFile) return file;
	}
	return null;
}
