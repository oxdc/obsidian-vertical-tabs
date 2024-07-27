import {
	Workspace,
	WorkspaceItem,
	WorkspaceLeaf,
	WorkspaceParent,
} from "obsidian";

export type VTWorkspaceID = string;

export interface VTWorkspace extends Workspace {
	onLayoutChange(): void;
}

export interface VTWorkspaceParent extends WorkspaceParent {
	id?: VTWorkspaceID;
	children: VTWorkspaceLeaf[];
	selectTab: (leaf: VTWorkspaceLeaf) => void;
}

export interface VTWorkspaceLeaf extends WorkspaceLeaf {
	id?: VTWorkspaceID;
	parentSplit?: VTWorkspaceParent;
}

export interface VTWorkspaceGroup extends WorkspaceItem {
	id?: VTWorkspaceID;
}
