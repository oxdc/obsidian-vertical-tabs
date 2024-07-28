import * as Obsidian from "obsidian";

export type Identifier = string;

export interface Workspace extends Obsidian.Workspace {
	iterateLeaves(
		split: Obsidian.WorkspaceSplit,
		callback: (leaf: WorkspaceLeaf) => void
	): void;
	onLayoutChange: () => void;
}

export interface WorkspaceParent extends Obsidian.WorkspaceParent {
	id: Identifier;
	children: WorkspaceLeaf[];
	selectTab: (leaf: WorkspaceLeaf) => void;
}

export interface WorkspaceLeaf extends Obsidian.WorkspaceLeaf {
	id: Identifier;
	parent: WorkspaceParent;
	parentSplit: WorkspaceParent;
}
