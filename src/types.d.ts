import { Identifier } from "./models/VTWorkspace";

declare module "obsidian" {
	interface SyncViewState {
		active: boolean;
		state: ViewState;
		eState: unknown;
	}

	interface ItemView {
		getSyncViewState: () => SyncViewState;
	}

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
		on(
			name: "vertical-tabs:ephemeral-tabs-init",
			callback: (autoClose: boolean) => void
		): EventRef;
		on(
			name: "vertical-tabs:ephemeral-tabs-deinit",
			callback: () => void
		): EventRef;
		on(
			name: "vertical-tabs:ephemeral-tabs-update",
			callback: (enabled: boolean, autoClose: boolean) => void
		): EventRef;
		on(
			name: "vertical-tabs:deduplicate-tabs",
			callback: () => void
		): EventRef;
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

	interface HistoryState {
		title: string;
		state: ViewState;
		eState: unknown;
	}

	interface MarkdownViewState extends ViewState {
		type: "markdown";
		title: string;
		state: {
			file: string;
		};
	}

	interface WorkspaceLeaf {
		id: Identifier;
		activeTime: number;
		isEphemeral?: boolean;
		parent: WorkspaceTabs | WorkspaceMobileDrawer;
		setParent: (parent: WorkspaceParent) => void;
		containerEl?: HTMLElement;
		tabHeaderEl?: HTMLElement;
		tabHeaderInnerTitleEl?: HTMLElement;
		isVisible: () => boolean;
		canNavigate(): boolean;
		getHistoryState: () => HistoryState;
		history: {
			backHistory: HistoryState[];
			forwardHistory: HistoryState[];
			back: () => void;
			forward: () => void;
			go: (offset: number) => void;
		};
		on(
			name: "ephemeral-toggle",
			callback: (isEphemeral: boolean) => void
		): EventRef;
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

	interface VTBookmarkGroupItem extends BookmarkGroupItem {
		isCreatedByVT: boolean;
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
						saveData: () => void;
					};
				};
			};
		};
		plugins: {
			enabledPlugins: Set<string>;
			plugins: {
				"obsidian-hover-editor": {
					activePopovers: {
						rootSplit?: WorkspaceSplit;
					}[];
				};
			};
		};
	}

	interface Menu {
		items: MenuItem[];
	}

	interface MenuItem {
		setSubmenu: () => Menu;
		section?: string;
	}

	interface WebviewView extends ItemView {
		toggleReaderMode: () => void;
		saveAsMarkdown: () => Promise<TFile | null>;
		zoomIn: () => void;
		zoomOut: () => void;
		zoomReset: () => void;
		webview: {
			addEventListener: (type: string, listener: unknown) => void;
		};
	}
}
