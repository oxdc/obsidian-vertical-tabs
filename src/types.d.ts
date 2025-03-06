import { GroupViewType } from "./models/VTGroupView";
import { Identifier } from "./models/VTWorkspace";
import { EVENTS } from "./constants/events";

export {};

declare module "obsidian" {
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
