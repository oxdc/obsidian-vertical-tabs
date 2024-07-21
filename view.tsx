import { StrictMode } from "react";
import { AppContext } from "context";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { ReactView } from "./ReactView";

export const VIEW_TYPE = "vertical-tabs";

export class VerticalTabsView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
			<AppContext.Provider value={this.app}>
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
