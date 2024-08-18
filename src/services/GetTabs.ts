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
	const workspace = app.workspace as VT.Workspace;

	const { leftSplit, rightSplit, rootSplit, floatingSplit } = workspace;

	workspace.iterateLeaves(leftSplit, (leaf) =>
		record("left-sidebar", VT.GroupType.LeftSidebar, leaf, content)
	);

	workspace.iterateLeaves(rightSplit, (leaf) =>
		record("right-sidebar", VT.GroupType.RightSidebar, leaf, content)
	);

	workspace.iterateLeaves(rootSplit, (leaf) => {
		const parent = leaf.parent as VT.WorkspaceParent;
		record(parent.id, VT.GroupType.RootSplit, leaf, content);
	});

	workspace.iterateLeaves(floatingSplit, (leaf) => {
		const parent = leaf.parent as VT.WorkspaceParent;
		record(parent.id, VT.GroupType.RootSplit, leaf, content);
	});

	return content;
}
