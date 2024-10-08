import { Identifier } from "./models/VTWorkspace";

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

	interface BookmarkItem {
		ctime: number;
		title: string;
		type: "file" | "search" | "group" | "graph" | "url" | "folder";
	}

	interface BookmarkFileItem extends BookmarkItem {
		type: "file";
		path: string;
		subpath?: string;
	}

	interface BookmarkSearchItem extends BookmarkItem {
		type: "search";
		query: string;
	}

	interface BookmarkGraphItem extends BookmarkItem {
		type: "graph";
		options: unknown;
	}

	interface BookmarkGroupItem extends BookmarkItem {
		type: "group";
		items: BookmarkItem[];
	}

	interface BookmarkWebItem extends BookmarkItem {
		type: "url";
		url: string;
	}

	interface App {
		internalPlugins: {
			plugins: {
				bookmarks: {
					enabled: boolean;
					instance: {
						items: BookmarkItem[];
						addItem: (
							item: BookmarkItem,
							target?: BookmarkGroupItem
						) => void;
						editItem: (item: BookmarkItem) => void;
						removeItem: (item: BookmarkItem) => void;
					};
				};
			};
		};
	}
}
