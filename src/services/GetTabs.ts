import {
	App,
	FileView,
	TFile,
	WorkspaceLeaf,
	WorkspaceParent,
	WorkspaceSplit,
} from "obsidian";
import { TabCacheData } from "src/stores/TabCacheStore";
import { GroupType, Identifier } from "src/models/VTWorkspace";
import { managedLeafStore } from "src/stores/ManagedLeafStore";

type RecordData = TabCacheData & {
	groupIDs: Identifier[];
	leafIDs: Identifier[];
};

// prettier-ignore
function record(app: App, groupID: string, groupType: GroupType, leaf: WorkspaceLeaf, data: TabCacheData) {
	const { isManagedLeaf } = managedLeafStore.getActions();
	if (isManagedLeaf(app, leaf)) return;
	if (!data.groups.has(groupID)) {
		const group = leaf.parent as WorkspaceParent;
		data.groups.set(groupID, { group, groupType, leafIDs: [] });
	}
	data.groups.get(groupID)?.leafIDs.push(leaf.id);
	data.leaves.set(leaf.id, { leaf, groupID });
	// If guessedCreationTime is not set, we assume the leaf was created now
	if (!leaf.guessedCreationTime) {
		leaf.guessedCreationTime = Date.now();
	}
}

// prettier-ignore
export function getTabs(app: App): RecordData {
	const data: TabCacheData = { groups: new Map(), leaves: new Map() };
	const workspace = app.workspace;
	const { leftSplit, rightSplit, rootSplit, floatingSplit } = workspace;
	managedLeafStore.getActions().refresh(app);
	workspace.iterateLeaves(leftSplit as WorkspaceSplit, (leaf) =>
		record(app, "left-sidebar", GroupType.LeftSidebar, leaf, data)
	);
	workspace.iterateLeaves(rightSplit as WorkspaceSplit, (leaf) =>
		record(app, "right-sidebar", GroupType.RightSidebar, leaf, data)
	);
	workspace.iterateLeaves(rootSplit, (leaf) =>
		record(app, leaf.parent.id, GroupType.RootSplit, leaf, data)
	);
	workspace.iterateLeaves(floatingSplit, (leaf) =>
		record(app, leaf.parent.id, GroupType.RootSplit, leaf, data)
	);
	const groupIDs = Array.from(data.groups.keys());
	const leafIDs = Array.from(data.leaves.keys());
	return { ...data, groupIDs, leafIDs };
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
	workspace.iterateLeaves(leftSplit as WorkspaceSplit, callback);
	workspace.iterateLeaves(rightSplit as WorkspaceSplit, callback);
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

export function getLeavesWithFile(app: App, file: TFile): WorkspaceLeaf[] {
	const leaves: WorkspaceLeaf[] = [];
	app.workspace.iterateAllLeaves((leaf) => {
		if (getOpenFileOfLeaf(app, leaf) === file) {
			leaves.push(leaf);
		}
	});
	return leaves;
}
