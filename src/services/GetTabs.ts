import { App, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { createNewTabCache, TabCache } from "src/models/TabCache";
import { GroupType } from "src/models/VTWorkspace";

function record(
	nameOrID: string,
	type: GroupType,
	leaf: WorkspaceLeaf,
	content: TabCache
) {
	content.get(nameOrID).groupType = type;
	content.get(nameOrID).group = leaf.parent as WorkspaceParent;
	content.get(nameOrID).leaves.push(leaf);
	content.get(nameOrID).leafIDs.push(leaf.id);
}

export function getTabs(app: App): TabCache {
	const content = createNewTabCache();
	const workspace = app.workspace;
	const { leftSplit, rightSplit, rootSplit, floatingSplit } = workspace;
	workspace.iterateLeaves(leftSplit, (leaf) =>
		record("left-sidebar", GroupType.LeftSidebar, leaf, content)
	);
	workspace.iterateLeaves(rightSplit, (leaf) =>
		record("right-sidebar", GroupType.RightSidebar, leaf, content)
	);
	workspace.iterateLeaves(rootSplit, (leaf) => {
		record(leaf.parent.id, GroupType.RootSplit, leaf, content);
	});
	workspace.iterateLeaves(floatingSplit, (leaf) => {
		record(leaf.parent.id, GroupType.RootSplit, leaf, content);
	});
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
