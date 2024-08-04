import * as Obsidian from "obsidian";

export type Identifier = string;

export enum GroupType {
	LeftSidebar = "left-sidebar",
	RightSidebar = "right-sidebar",
	RootSplit = "root-split",
}

export interface Workspace extends Obsidian.Workspace {
	iterateLeaves(
		split: Obsidian.WorkspaceSplit,
		callback: (leaf: WorkspaceLeaf) => void
	): void;
	onLayoutChange: () => void;
}

export interface WorkspaceParent extends Obsidian.WorkspaceParent {
	id: Identifier;
	currentTab: number;
	children: WorkspaceLeaf[];
	selectTab: (leaf: WorkspaceLeaf) => void;
	selectTabIndex: (index: number) => void;
	recomputeChildrenDimensions: () => void;
	detach: () => void;
}

export interface WorkspaceLeaf extends Obsidian.WorkspaceLeaf {
	id: Identifier;
	activeTime: number;
	parent: WorkspaceParent;
	setParent: (parent: WorkspaceParent) => void;
	tabHeaderEl?: HTMLElement;
	tabHeaderInnerTitleEl?: HTMLElement;
}
