import * as VT from "../models/VTWorkspace";

export type TabCompareFn = (a: VT.WorkspaceLeaf, b: VT.WorkspaceLeaf) => number;

export type SortStrategy = {
	compareFn: TabCompareFn;
	reverse: boolean;
};

export function sortTabs(
	group: VT.WorkspaceParent,
	sortStrategy: SortStrategy
) {
	const activeLeaf = group.children[group.currentTab];
	group.children.sort(sortStrategy.compareFn);
	if (sortStrategy.reverse) group.children.reverse();
	group.recomputeChildrenDimensions();
	group.selectTab(activeLeaf);
}

export function byTitle(a: VT.WorkspaceLeaf, b: VT.WorkspaceLeaf) {
	return a.getDisplayText().localeCompare(b.getDisplayText());
}

export function byPinned(a: VT.WorkspaceLeaf, b: VT.WorkspaceLeaf) {
	if (a.getViewState().pinned === b.getViewState().pinned) {
		return 0;
	}
	return a.getViewState().pinned ? -1 : 1;
}

export function byActiveTime(a: VT.WorkspaceLeaf, b: VT.WorkspaceLeaf) {
	return b.activeTime - a.activeTime;
}
