import { App } from "obsidian";
import { createNewTabCache, TabCache } from "src/models/TabCache";
import * as VT from "src/models/VTWorkspace";

export function getTabs(app: App): TabCache {
	const tabs = createNewTabCache();

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.leftSplit,
		(leaf) => {
			tabs.get("left-sidedock")?.push(leaf);
		}
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rightSplit,
		(leaf) => {
			tabs.get("right-sidedock")?.push(leaf);
		}
	);

	(app.workspace as VT.Workspace).iterateLeaves(
		app.workspace.rootSplit,
		(leaf) => {
			const parent = leaf.parent as VT.WorkspaceParent;
			tabs.get(parent.id)?.push(leaf);
		}
	);

	return tabs;
}
