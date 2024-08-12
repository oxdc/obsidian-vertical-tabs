import { App } from "obsidian";
import { createNewTabCache, TabCache } from "src/models/TabCache";
import * as VT from "src/models/VTWorkspace";

function record(
	nameOrID: string,
	type: VT.GroupType,
	leaf: VT.WorkspaceLeaf,
	content: TabCache
) {
	content.get(nameOrID).groupType = type;
	content.get(nameOrID).group = leaf.parent as VT.WorkspaceParent;
	content.get(nameOrID).leaves.push(leaf);
	content.get(nameOrID).leafIDs.push(leaf.id);
}

export function getTabs(app: App): TabCache {
	const content = createNewTabCache();

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.leftSplit,
		(leaf) =>
			record("left-sidebar", VT.GroupType.LeftSidebar, leaf, content)
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rightSplit,
		(leaf) =>
			record("right-sidebar", VT.GroupType.RightSidebar, leaf, content)
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rootSplit,
		(leaf) => {
			const parent = leaf.parent as VT.WorkspaceParent;
			record(parent.id, VT.GroupType.RootSplit, leaf, content);
		}
	);

	return content;
}
