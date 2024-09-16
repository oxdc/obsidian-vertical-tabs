import { App, WorkspaceMobileDrawer, WorkspaceSidedock } from "obsidian";
import * as VT from "../models/VTWorkspace";
import { VIEW_TYPE } from "src/navigation";

function removeChild(parent: VT.WorkspaceParent, index: number) {
	parent.children.splice(index, 1);
	if (parent.children.length === 0) {
		parent.detach();
	} else {
		parent.selectTabIndex(Math.max(0, index - 1));
	}
	parent.recomputeChildrenDimensions();
}

function insertChild(
	parent: VT.WorkspaceParent,
	leaf: VT.WorkspaceLeaf,
	index: number | null = null
) {
	if (index === null) {
		parent.children.push(leaf);
	} else {
		parent.children.splice(index, 0, leaf);
	}
	leaf.setParent(parent);
	parent.selectTab(leaf);
	parent.recomputeChildrenDimensions();
}

export function moveTab(
	app: App,
	sourceID: VT.Identifier,
	targetID: VT.Identifier | null
) {
	if (!targetID) return;
	if (sourceID === targetID) return;
	const sourceLeaf = app.workspace.getLeafById(sourceID) as VT.WorkspaceLeaf;
	const targetLeaf = app.workspace.getLeafById(targetID) as VT.WorkspaceLeaf;
	const sourceParent = sourceLeaf.parent as VT.WorkspaceParent;
	const targetParent = targetLeaf.parent as VT.WorkspaceParent;
	const sourceIndex = sourceParent.children.indexOf(sourceLeaf);
	const targetIndex = targetParent.children.indexOf(targetLeaf);
	removeChild(sourceParent, sourceIndex);
	insertChild(targetParent, sourceLeaf, targetIndex);
	(app.workspace as VT.Workspace).onLayoutChange();
}

export function moveTabToEnd(
	app: App,
	sourceID: VT.Identifier,
	targetParent: VT.WorkspaceParent
) {
	const sourceLeaf = app.workspace.getLeafById(sourceID) as VT.WorkspaceLeaf;
	const sourceParent = sourceLeaf.parent as VT.WorkspaceParent;
	const sourceIndex = sourceParent.children.indexOf(sourceLeaf);
	removeChild(sourceParent, sourceIndex);
	insertChild(targetParent, sourceLeaf);
	(app.workspace as VT.Workspace).onLayoutChange();
}

export async function moveTabToNewGroup(app: App, sourceID: VT.Identifier) {
	const sourceLeaf = app.workspace.getLeafById(sourceID) as VT.WorkspaceLeaf;
	const sourceParent = sourceLeaf.parent as VT.WorkspaceParent;
	const height = sourceParent.containerEl.clientHeight;
	const width = sourceParent.containerEl.clientWidth;
	const preferredDirection = height > width ? "horizontal" : "vertical";
	await app.workspace.duplicateLeaf(sourceLeaf, "split", preferredDirection);
	sourceLeaf.detach();
}

export function isSelfContainedInGroup(
	app: App,
	groupID: VT.Identifier
): boolean {
	const leaves = app.workspace.getLeavesOfType(VIEW_TYPE);
	if (leaves.length === 0) return false;
	const self = leaves[0] as VT.WorkspaceLeaf;
	return self.parent?.id === groupID;
}

export function isSelfTheOnlyChildOfGroup(
	app: App,
	groupID: VT.Identifier
): boolean {
	const leaves = app.workspace.getLeavesOfType(VIEW_TYPE);
	if (leaves.length === 0) return false;
	const self = leaves[0] as VT.WorkspaceLeaf;
	const parent = self.parent as VT.WorkspaceParent;
	return self.parent?.id === groupID && parent.children.length === 1;
}

export async function moveSelfToDefaultLocation(app: App) {
	const workspace = app.workspace as VT.Workspace;
	const leaves = workspace.getLeavesOfType(VIEW_TYPE);
	if (leaves.length === 0) return;
	const self = leaves[0] as VT.WorkspaceLeaf;
	const leftSidebar = workspace.leftSplit;
	if (leftSidebar instanceof WorkspaceSidedock) {
		const container = leftSidebar as VT.WorkspaceSidedock;
		const parent = container.children[0] as VT.WorkspaceParent;
		moveTabToEnd(app, self.id, parent);
	} else if (leftSidebar instanceof WorkspaceMobileDrawer) {
		const parent = leftSidebar.parent as VT.WorkspaceParent;
		moveTabToEnd(app, self.id, parent);
	}
}
