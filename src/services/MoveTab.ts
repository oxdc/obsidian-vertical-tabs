import { App } from "obsidian";
import * as VT from "../models/VTWorkspace";

export function moveTab(
	app: App,
	source: VT.Identifier,
	target: VT.Identifier | null
) {
	if (!target) return;
	const sourceLeaf = app.workspace.getLeafById(source) as VT.WorkspaceLeaf;
	const targetLeaf = app.workspace.getLeafById(target) as VT.WorkspaceLeaf;
	const sourceParent = sourceLeaf.parentSplit as VT.WorkspaceParent;
	sourceParent.removeChild(sourceLeaf);
}
