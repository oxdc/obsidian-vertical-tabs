import {
	Workspace,
	WorkspaceItem,
	WorkspaceLeaf,
	WorkspaceParent,
} from "obsidian";

export type Identifier = string;

export const DEFAULT_ID = "default";

export interface VTWorkspace extends Workspace {
	onLayoutChange(): void;
}

export interface VTWorkspaceParent extends WorkspaceParent {
	id?: Identifier;
	children: VTWorkspaceLeaf[];
	selectTab: (leaf: VTWorkspaceLeaf) => void;
}

export interface VTWorkspaceLeaf extends WorkspaceLeaf {
	id?: Identifier;
	parentSplit?: VTWorkspaceParent;
}

export interface VTWorkspaceGroup extends WorkspaceItem {
	id?: Identifier;
}
