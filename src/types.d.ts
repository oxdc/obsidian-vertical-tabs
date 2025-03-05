import { GroupViewType } from "./models/VTGroupView";
import { Identifier } from "./models/VTWorkspace";
import { EVENTS } from "./constants/events";
import { QuickSwitcherItem, WorkspaceSplit } from "obsidian";
import { SuggestModal } from "obsidian";

export {};

// Quick Switcher API
declare module "obsidian-typings" {
	interface SwitcherPluginInstance {
		QuickSwitcherModal: typeof SuggestModal<QuickSwitcherItem>;
	}
}

// Hover Editor API
declare module "obsidian-typings" {
	interface PluginsPluginsRecord {
		"obsidian-hover-editor": {
			activePopovers: {
				rootSplit?: WorkspaceSplit;
			}[];
		};
	}
}

declare module "obsidian" {
	interface SyncViewState {
		active: boolean;
		state: ViewState;
		eState: unknown;
	}

	interface FileView {
		isDetachingFromVT?: boolean;
		getSyncViewState(): SyncViewState;
	}

	interface Workspace {
		leftSidebarToggleButtonEl: HTMLElement;
		rightSidebarToggleButtonEl: HTMLElement;
		floatingSplit: WorkspaceSplit;
		on(name: typeof EVENTS.UPDATE_TOGGLE, callback: () => void): EventRef;
		on(
			name: typeof EVENTS.EPHEMERAL_TABS_INIT,
			callback: (autoClose: boolean) => void
		): EventRef;
		on(
			name: typeof EVENTS.EPHEMERAL_TABS_DEINIT,
			callback: () => void
		): EventRef;
		on(
			name: typeof EVENTS.EPHEMERAL_TABS_UPDATE,
			callback: (enabled: boolean, autoClose: boolean) => void
		): EventRef;
		on(
			name: typeof EVENTS.DEDUPLICATE_TABS,
			callback: () => void
		): EventRef;
		on(
			name: typeof EVENTS.ENHANCED_KEYBOARD_TAB_SWITCH,
			callback: () => void
		): EventRef;
		on(
			name: typeof EVENTS.RESET_KEYBOARD_TAB_SWITCH,
			callback: () => void
		): EventRef;
	}

	interface WorkspaceParent {
		id: Identifier;
		tabsContainerEl: HTMLElement;
		currentTab: number;
		children: WorkspaceLeaf[];
		selectTab: (leaf: WorkspaceLeaf) => void;
		selectTabIndex: (index: number) => void;
		recomputeChildrenDimensions: () => void;
		isStacked: boolean;
		setStacked: (stacked: boolean) => void;
		detach: () => void;
		tabHeaderContainerEl: HTMLElement;
		isLinkedGroup?: boolean;
		on(
			name: typeof EVENTS.GROUP_VIEW_CHANGE,
			callback: (viewType: GroupViewType) => void
		): EventRef;
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
		pinned?: boolean;
		isEphemeral?: boolean;
		isLinkedFile?: boolean;
		parent: WorkspaceTabs | WorkspaceMobileDrawer;
		setParent: (parent: WorkspaceParent) => void;
		guessedCreationTime?: number;
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
			name: typeof EVENTS.EPHEMERAL_TOGGLE,
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

	interface QuickSwitcherItem {
		type: "file" | unknown;
		file?: TFile;
	}

	interface Menu {
		items: MenuItem[];
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

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface SuggestModal<T> {
		chooser: {
			setSelectedItem: (index: number) => void;
		};
	}
}
