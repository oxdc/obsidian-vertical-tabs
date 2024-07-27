import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { NavigationContainer } from "./components/NavigationContainer";
import { TabManagerContext } from "./context";
import { TabManager } from "./models/TabManager";
import ObsidianVerticalTabs from "./main";

export const VIEW_TYPE = "vertical-tabs";

export class NavigationView extends ItemView {
	root: Root | null = null;
	tabManager: TabManager;

	constructor(leaf: WorkspaceLeaf, plugin: ObsidianVerticalTabs) {
		super(leaf);
		this.tabManager = new TabManager(this.app);
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "Navigation View";
	}

	async onOpen() {
		this.root = createRoot(this.containerEl);
		this.root.render(
			<StrictMode>
				<TabManagerContext.Provider value={this.tabManager}>
					<NavigationContainer />
				</TabManagerContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
