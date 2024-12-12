import { WorkspaceLeaf, WorkspaceParent } from "obsidian";

export type TabCompareFn = (a: WorkspaceLeaf, b: WorkspaceLeaf) => number;

export type SortStrategy = {
	compareFn: TabCompareFn;
	reverse: boolean;
};

export function sortTabs(group: WorkspaceParent, sortStrategy: SortStrategy) {
	const activeLeaf = group.children[group.currentTab];
	group.children.sort(sortStrategy.compareFn);
	if (sortStrategy.reverse) group.children.reverse();
	group.recomputeChildrenDimensions();
	if (group.selectTab) group.selectTab(activeLeaf);
	return group.children;
}

export function byTitle(a: WorkspaceLeaf, b: WorkspaceLeaf) {
	return a.getDisplayText().localeCompare(b.getDisplayText());
}

export function byPinned(a: WorkspaceLeaf, b: WorkspaceLeaf) {
	if (a.getViewState().pinned === b.getViewState().pinned) {
		return 0;
	}
	return a.getViewState().pinned ? -1 : 1;
}

export function byActiveTime(a: WorkspaceLeaf, b: WorkspaceLeaf) {
	return b.activeTime - a.activeTime;
}
