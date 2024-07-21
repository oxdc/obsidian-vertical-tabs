import { StrictMode } from "react";
import { AppContext, AppContextContent } from "./context";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { ReactView } from "./ReactView";
import ObsidianVerticalTabs from "main";

export const VIEW_TYPE = "vertical-tabs";

export class VerticalTabsView extends ItemView {
	root: Root | null = null;
	context: AppContextContent;

	constructor(leaf: WorkspaceLeaf, private plugin: ObsidianVerticalTabs) {
		super(leaf);
		this.context = {
			app: this.app,
			plugin: this.plugin,
		};
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return "Example view";
	}

	async onOpen() {
		this.root = createRoot(this.containerEl.children[1]);
		this.root.render(
			<AppContext.Provider value={this.context}>
				<StrictMode>
					<ReactView />
				</StrictMode>
			</AppContext.Provider>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
