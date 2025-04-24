import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { NavigationContainer } from "../components/NavigationContainer";
import { PluginContext } from "../models/PluginContext";
import ObsidianVerticalTabs from "../main";

export const VERTICAL_TABS_VIEW = "vertical-tabs";

export class VerticalTabsView extends ItemView {
	root: Root | null = null;
	plugin: ObsidianVerticalTabs;

	constructor(leaf: WorkspaceLeaf, plugin: ObsidianVerticalTabs) {
		super(leaf);
		this.navigation = false;
		this.plugin = plugin;
		this.icon = "vertical-tabs";
		this.leaf.containerEl?.addClass("obsidian-vertical-tabs-tab-content");
		this.leaf.tabHeaderEl?.addClass("obsidian-vertical-tabs-tab-header");
	}

	getViewType() {
		return VERTICAL_TABS_VIEW;
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
