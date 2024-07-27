import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { VerticalTabsView } from "./components/VerticalTabsView";

export const VIEW_TYPE = "vertical-tabs";

export class NavigationView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
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
				<VerticalTabsView />
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
