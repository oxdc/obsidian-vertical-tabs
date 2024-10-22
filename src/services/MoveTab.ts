import {
	App,
	WorkspaceLeaf,
	WorkspaceMobileDrawer,
	WorkspaceParent,
	WorkspaceSidedock,
} from "obsidian";
import { Identifier } from "src/models/VTWorkspace";
import { VIEW_TYPE } from "src/navigation";

function removeChild(parent: WorkspaceParent, index: number) {
	parent.children.splice(index, 1);
	if (parent.children.length === 0) {
		parent.detach();
	} else {
		parent.selectTabIndex(Math.max(0, index - 1));
	}
	parent.recomputeChildrenDimensions();
}

function insertChild(
	parent: WorkspaceParent,
	leaf: WorkspaceLeaf,
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
	sourceID: Identifier,
	targetID: Identifier | null
) {
	if (!targetID) return;
	if (sourceID === targetID) return;
	const sourceLeaf = app.workspace.getLeafById(sourceID);
	const targetLeaf = app.workspace.getLeafById(targetID);
	if (!sourceLeaf || !targetLeaf) return;
	const sourceParent = sourceLeaf.parent;
	const targetParent = targetLeaf.parent;
	const sourceIndex = sourceParent.children.indexOf(sourceLeaf);
	const targetIndex = targetParent.children.indexOf(targetLeaf);
	removeChild(sourceParent, sourceIndex);
	insertChild(targetParent, sourceLeaf, targetIndex);
	app.workspace.onLayoutChange();
}

export function moveTabToEnd(
	app: App,
	sourceID: Identifier,
	targetParent: WorkspaceParent
) {
	const sourceLeaf = app.workspace.getLeafById(sourceID);
	if (!sourceLeaf) return;
	const sourceParent = sourceLeaf.parent;
	const sourceIndex = sourceParent.children.indexOf(sourceLeaf);
	removeChild(sourceParent, sourceIndex);
	insertChild(targetParent, sourceLeaf);
	app.workspace.onLayoutChange();
}

export async function moveTabToNewGroup(app: App, sourceID: Identifier) {
	const sourceLeaf = app.workspace.getLeafById(sourceID);
	if (!sourceLeaf) return;
	const sourceParent = sourceLeaf.parent;
	const height = sourceParent.containerEl.clientHeight;
	const width = sourceParent.containerEl.clientWidth;
	const preferredDirection = height > width ? "horizontal" : "vertical";
	const targetLeaf = await app.workspace.duplicateLeaf(
		sourceLeaf,
		"split",
		preferredDirection
	);
	targetLeaf.setPinned(!!sourceLeaf.getViewState().pinned);
	sourceLeaf.detach();
	return targetLeaf;
}

export function selfIsNotInTheSidebar(app: App) {
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VIEW_TYPE).first();
	if (!self) return false;
	const root = self.getRoot();
	return root !== workspace.leftSplit && root !== workspace.rightSplit;
}

export async function moveSelfToDefaultLocation(app: App) {
	const workspace = app.workspace;
	const leaves = workspace.getLeavesOfType(VIEW_TYPE);
	if (leaves.length === 0) return;
	const self = leaves[0];
	const leftSidebar = workspace.leftSplit;
	if (leftSidebar instanceof WorkspaceSidedock) {
		const parent = leftSidebar.children[0] as unknown as WorkspaceParent;
		moveTabToEnd(app, self.id, parent);
	} else if (leftSidebar instanceof WorkspaceMobileDrawer) {
		const parent = leftSidebar.parent;
		moveTabToEnd(app, self.id, parent);
	}
}
