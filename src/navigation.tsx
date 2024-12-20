import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { NavigationContainer } from "./components/NavigationContainer";
import { PluginContext } from "./models/PluginContext";
import ObsidianVerticalTabs from "./main";

export const VIEW_TYPE = "vertical-tabs";

export class NavigationView extends ItemView {
	root: Root | null = null;
	plugin: ObsidianVerticalTabs;

	constructor(leaf: WorkspaceLeaf, plugin: ObsidianVerticalTabs) {
		super(leaf);
		this.navigation = false;
		this.plugin = plugin;
		this.icon = "gallery-vertical";
		this.leaf.containerEl?.addClass("obsidian-vertical-tabs-tab-content");
		this.leaf.tabHeaderEl?.addClass("obsidian-vertical-tabs-tab-header");
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "Vertical tabs";
	}

	async onOpen() {
		this.root = createRoot(this.containerEl);
		this.root.render(
			<StrictMode>
				<PluginContext.Provider value={this.plugin}>
					<NavigationContainer />
				</PluginContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
