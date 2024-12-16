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
): WorkspaceLeaf | null {
	if (!targetID) return null;
	if (sourceID === targetID) return null;
	const sourceLeaf = app.workspace.getLeafById(sourceID);
	const targetLeaf = app.workspace.getLeafById(targetID);
	if (!sourceLeaf || !targetLeaf) return null;
	const sourceParent = sourceLeaf.parent;
	const targetParent = targetLeaf.parent;
	const sourceIndex = sourceParent.children.indexOf(sourceLeaf);
	const targetIndex = targetParent.children.indexOf(targetLeaf);
	const insertIndex =
		sourceParent.id === targetParent.id && sourceIndex < targetIndex
			? targetIndex - 1
			: targetIndex;
	removeChild(sourceParent, sourceIndex);
	insertChild(targetParent, sourceLeaf, insertIndex);
	app.workspace.onLayoutChange();
	return sourceLeaf;
}

export function moveTabToEnd(
	app: App,
	sourceID: Identifier,
	targetParent: WorkspaceParent
): WorkspaceLeaf | null {
	const sourceLeaf = app.workspace.getLeafById(sourceID);
	if (!sourceLeaf) return null;
	const sourceParent = sourceLeaf.parent;
	const sourceIndex = sourceParent.children.indexOf(sourceLeaf);
	removeChild(sourceParent, sourceIndex);
	insertChild(targetParent, sourceLeaf);
	app.workspace.onLayoutChange();
	return sourceLeaf;
}

export async function moveTabToNewGroup(
	app: App,
	sourceID: Identifier
): Promise<WorkspaceLeaf | null> {
	const sourceLeaf = app.workspace.getLeafById(sourceID);
	if (!sourceLeaf) return null;
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

export function selfIsClosed(app: App) {
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VIEW_TYPE).first();
	return !self;
}

export function ensureSelfIsOpen(app: App) {
	if (selfIsClosed(app)) {
		const leaf = this.app.workspace.getLeftLeaf(false);
		leaf.setViewState({ type: VIEW_TYPE, active: true });
	}
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
