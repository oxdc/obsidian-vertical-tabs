export type Identifier = string;

export enum GroupType {
	LeftSidebar = "left-sidebar",
	RightSidebar = "right-sidebar",
	RootSplit = "root-split",
}

declare module "obsidian" {
	interface Workspace {
		iterateLeaves(
			split: WorkspaceSplit,
			callback: (leaf: WorkspaceLeaf) => void
		): void;
		onLayoutChange: () => void;
		getActiveFileView: () => FileView;
		leftSidebarToggleButtonEl: HTMLElement;
		rightSidebarToggleButtonEl: HTMLElement;
		floatingSplit: WorkspaceSplit;
		on(name: "vertical-tabs:update-toggle", callback: () => void): EventRef;
	}

	interface WorkspaceParent {
		id: Identifier;
		containerEl: HTMLElement;
		currentTab: number;
		children: WorkspaceLeaf[];
		selectTab: (leaf: WorkspaceLeaf) => void;
		selectTabIndex: (index: number) => void;
		recomputeChildrenDimensions: () => void;
		isStacked: boolean;
		setStacked: (stacked: boolean) => void;
		detach: () => void;
		tabHeaderContainerEl: HTMLElement;
	}

	interface WorkspaceLeaf {
		id: Identifier;
		activeTime: number;
		parent: WorkspaceTabs | WorkspaceMobileDrawer;
		setParent: (parent: WorkspaceParent) => void;
		tabHeaderEl?: HTMLElement;
		tabHeaderInnerTitleEl?: HTMLElement;
	}

	interface WorkspaceSidedock extends WorkspaceSplit {
		children: WorkspaceLeaf[];
	}
}
