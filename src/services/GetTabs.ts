import { App } from "obsidian";
import { createNewTabCache, TabCache } from "src/models/TabCache";
import * as VT from "src/models/VTWorkspace";

export function getTabs(app: App): TabCache {
	const tabs = createNewTabCache();

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.leftSplit,
		(leaf) => {
			tabs.get("left-sidebar").groupType = VT.GroupType.LeftSidebar;
			tabs.get("left-sidebar").leaves.push(leaf);
		}
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rightSplit,
		(leaf) => {
			tabs.get("right-sidebar").groupType = VT.GroupType.RightSidebar;
			tabs.get("right-sidebar").leaves.push(leaf);
		}
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rootSplit,
		(leaf) => {
			const parent = leaf.parent as VT.WorkspaceParent;
			tabs.get(parent.id).groupType = VT.GroupType.RootSplit;
			tabs.get(parent.id).leaves.push(leaf);
		}
	);

	return tabs;
}
