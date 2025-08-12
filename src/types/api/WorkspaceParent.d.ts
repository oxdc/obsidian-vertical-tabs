export {};

declare module "obsidian" {
	interface WorkspaceParent {
		tabsContainerEl: HTMLElement;
		currentTab: number;
		children: WorkspaceLeaf[];
		removeChild: (leaf: WorkspaceLeaf) => void;
		insertChild: (index: number, leaf: WorkspaceLeaf) => void;
		selectTab(leaf: WorkspaceLeaf): void;
		selectTabIndex(index: number): void;
		recomputeChildrenDimensions(): void;
		isStacked: boolean;
		setStacked(stacked: boolean): void;
		detach(): void;
		tabHeaderContainerEl: HTMLElement;
		isLinkedGroup?: boolean;
	}
}
