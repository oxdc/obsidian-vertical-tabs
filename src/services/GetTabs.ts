import { App } from "obsidian";
import { createNewTabCache, TabCache } from "src/models/TabCache";
import * as VT from "src/models/VTWorkspace";

function record(
	nameOrID: string,
	type: VT.GroupType,
	leaf: VT.WorkspaceLeaf,
	tabs: TabCache
) {
	tabs.get(nameOrID).groupType = type;
	tabs.get(nameOrID).group = leaf.parent as VT.WorkspaceParent;
	tabs.get(nameOrID).leaves.push(leaf);
}

export function getTabs(app: App): TabCache {
	const tabs = createNewTabCache();

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.leftSplit,
		(leaf) => record("left-sidebar", VT.GroupType.LeftSidebar, leaf, tabs)
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rightSplit,
		(leaf) => record("right-sidebar", VT.GroupType.RightSidebar, leaf, tabs)
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rootSplit,
		(leaf) => {
			const parent = leaf.parent as VT.WorkspaceParent;
			record(parent.id, VT.GroupType.RootSplit, leaf, tabs);
		}
	);

	return tabs;
}
