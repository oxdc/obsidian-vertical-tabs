import {
	App,
	WorkspaceLeaf,
	WorkspaceMobileDrawer,
	WorkspaceParent,
	WorkspaceSidedock,
} from "obsidian";
import { syncUIForGroupView } from "src/models/VTGroupView";
import { Identifier } from "src/models/VTWorkspace";
import { VERTICAL_TABS_VIEW } from "src/views/VerticalTabsView";
import { REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";
import { tabCacheStore } from "src/stores/TabCacheStore";

export function reapplyEphemeralState(
	leaf: WorkspaceLeaf,
	state: unknown = null
) {
	setTimeout(() => {
		const ephemeralState = state ?? leaf.getEphemeralState();
		leaf.setEphemeralState(ephemeralState);
	}, REFRESH_TIMEOUT_LONG);
}

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
	sourceParent.removeChild(sourceLeaf);
	sourceLeaf.setDimension(null);
	targetParent.insertChild(insertIndex, sourceLeaf);
	targetParent.selectTabIndex(insertIndex);
	app.workspace.requestResize();
	syncUIForGroupView(sourceParent);
	syncUIForGroupView(targetParent);
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
	reapplyEphemeralState(sourceLeaf);
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
	reapplyEphemeralState(targetLeaf, sourceLeaf.getEphemeralState());
	sourceLeaf.detach();
	return targetLeaf;
}

export async function moveSelfToNewGroupAndHide(app: App) {
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VERTICAL_TABS_VIEW).first();
	if (!self) return;
	const newSelf = await moveTabToNewGroup(app, self.id);
	if (!newSelf) return;
	newSelf.parent.containerEl.addClass("is-hidden");
}

export function selfIsClosed(app: App) {
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VERTICAL_TABS_VIEW).first();
	return !self;
}

export function ensureSelfIsOpen(app: App) {
	if (selfIsClosed(app)) {
		const leaf = this.app.workspace.getLeftLeaf(false);
		leaf.setViewState({ type: VERTICAL_TABS_VIEW, active: true });
	}
}

export function selfIsNotInTheSidebar(app: App) {
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VERTICAL_TABS_VIEW).first();
	if (!self) return false;
	const root = self.getRoot();
	return root !== workspace.leftSplit && root !== workspace.rightSplit;
}

export async function moveSelfToDefaultLocation(app: App) {
	const workspace = app.workspace;
	const leaves = workspace.getLeavesOfType(VERTICAL_TABS_VIEW);
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

export function moveMultipleTabs(
	app: App,
	sourceIDs: Identifier[],
	targetID: Identifier | null
): WorkspaceLeaf[] {
	if (!targetID || sourceIDs.length === 0) return [];

	const targetLeaf = app.workspace.getLeafById(targetID);
	if (!targetLeaf) return [];

	const sourceLeaves = sourceIDs
		.map((id) => app.workspace.getLeafById(id))
		.filter((leaf): leaf is WorkspaceLeaf => leaf !== null);

	if (sourceLeaves.length === 0) return [];

	// Sort source leaves by their original document order (across all groups)
	// This ensures consistent visual ordering regardless of selection order
	const sortedSourceLeaves = sortTabsByDocumentOrder(sourceLeaves);

	const targetParent = targetLeaf.parent;
	const originalTargetIndex = targetParent.children.indexOf(targetLeaf);

	// Collect source data for removal (similar to single-tab logic)
	const sourceData = sortedSourceLeaves.map((leaf) => ({
		leaf,
		parent: leaf.parent,
		index: leaf.parent.children.indexOf(leaf),
	}));

	// Count how many source tabs are in the same parent and before the target
	// This is crucial for calculating the correct insertion index
	const sameParentBeforeTarget = sourceData.filter(
		(s) => s.parent.id === targetParent.id && s.index < originalTargetIndex
	).length;

	// Calculate insertion index (matching single-tab logic)
	const insertIndex = originalTargetIndex - sameParentBeforeTarget;

	// Sort by parent and index to remove from end to beginning (preserves indices)
	sourceData.sort((a, b) => {
		if (a.parent.id !== b.parent.id) return 0;
		return b.index - a.index;
	});

	// Remove all source leaves from their parents
	for (const { leaf, parent } of sourceData) {
		parent.removeChild(leaf);
		leaf.setDimension(null);
	}

	// Insert all leaves at target location in correct order
	// Insert in forward order to maintain the original sequence
	for (let i = 0; i < sortedSourceLeaves.length; i++) {
		const leaf = sortedSourceLeaves[i];
		targetParent.insertChild(insertIndex + i, leaf);
	}

	// Select the first moved tab and recompute dimensions
	targetParent.selectTabIndex(insertIndex);
	app.workspace.requestResize();

	// Update UI for all affected parents
	const affectedParents = new Set(sourceData.map((s) => s.parent));
	affectedParents.add(targetParent);
	for (const parent of affectedParents) {
		syncUIForGroupView(parent);
	}

	return sortedSourceLeaves;
}

export function moveMultipleTabsToEnd(
	app: App,
	sourceIDs: Identifier[],
	targetParent: WorkspaceParent
): WorkspaceLeaf[] {
	if (sourceIDs.length === 0) return [];

	const sourceLeaves = sourceIDs
		.map((id) => app.workspace.getLeafById(id))
		.filter((leaf): leaf is WorkspaceLeaf => leaf !== null);

	if (sourceLeaves.length === 0) return [];

	// Sort source leaves by their original document order
	const sortedSourceLeaves = sortTabsByDocumentOrder(sourceLeaves);

	// Group source leaves by their parent for efficient removal
	const sourceData = sortedSourceLeaves.map((leaf) => ({
		leaf,
		parent: leaf.parent,
		index: leaf.parent.children.indexOf(leaf),
	}));

	// Sort by parent and index to remove from end to beginning
	sourceData.sort((a, b) => {
		if (a.parent.id !== b.parent.id) return 0;
		return b.index - a.index;
	});

	// Remove leaves from their original parents
	for (const { parent, index } of sourceData) {
		removeChild(parent, index);
	}

	// Insert all leaves at the end of target parent
	for (const leaf of sortedSourceLeaves) {
		insertChild(targetParent, leaf);
	}

	app.workspace.onLayoutChange();

	// Reapply ephemeral state for all moved leaves
	for (const leaf of sortedSourceLeaves) {
		reapplyEphemeralState(leaf);
	}

	return sortedSourceLeaves;
}

export async function moveMultipleTabsToNewGroup(
	app: App,
	sourceIDs: Identifier[]
): Promise<WorkspaceLeaf[]> {
	if (sourceIDs.length === 0) return [];

	// Sort tabs by original document order first
	const allSourceLeaves = sourceIDs
		.map((id) => app.workspace.getLeafById(id))
		.filter((leaf): leaf is WorkspaceLeaf => leaf !== null);

	if (allSourceLeaves.length === 0) return [];

	// Sort by original document order
	const sortedSourceLeaves = sortTabsByDocumentOrder(allSourceLeaves);

	const firstSourceLeaf = sortedSourceLeaves[0];
	if (!firstSourceLeaf) return [];

	const sourceParent = firstSourceLeaf.parent;
	const height = sourceParent.containerEl.clientHeight;
	const width = sourceParent.containerEl.clientWidth;
	const preferredDirection = height > width ? "horizontal" : "vertical";

	// Create new group with first tab
	const firstTargetLeaf = await app.workspace.duplicateLeaf(
		firstSourceLeaf,
		"split",
		preferredDirection
	);
	firstTargetLeaf.setPinned(!!firstSourceLeaf.getViewState().pinned);
	reapplyEphemeralState(firstTargetLeaf, firstSourceLeaf.getEphemeralState());
	firstSourceLeaf.detach();

	// Move remaining tabs to the new group
	if (sortedSourceLeaves.length > 1) {
		const remainingLeaves = sortedSourceLeaves.slice(1);
		const remainingIDs = remainingLeaves.map((leaf) => leaf.id);
		const movedLeaves = moveMultipleTabsToEnd(
			app,
			remainingIDs,
			firstTargetLeaf.parent
		);
		return [firstTargetLeaf, ...movedLeaves];
	}

	return [firstTargetLeaf];
}

// Helper function to get the group index using tabCacheStore order
function getGroupIndex(parent: WorkspaceParent): number {
	const { groupIDs } = tabCacheStore.getState();
	return groupIDs.indexOf(parent.id);
}

// Utility function to sort tabs by their original document order
function sortTabsByDocumentOrder(tabs: WorkspaceLeaf[]): WorkspaceLeaf[] {
	return [...tabs].sort((a, b) => {
		const aGroupIndex = getGroupIndex(a.parent);
		const bGroupIndex = getGroupIndex(b.parent);

		// If in different groups, sort by group order
		if (aGroupIndex !== bGroupIndex) {
			return aGroupIndex - bGroupIndex;
		}

		// If in same group, sort by tab index within group
		return a.parent.children.indexOf(a) - b.parent.children.indexOf(b);
	});
}
