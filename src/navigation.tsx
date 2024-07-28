import { StrictMode } from "react";
import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { NavigationContainer } from "./components/NavigationContainer";
import { AppContext } from "./models/AppContext";

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
				<AppContext.Provider value={this.app}>
					<NavigationContainer />
				</AppContext.Provider>
			</StrictMode>
		);
	}

	async onClose() {
		this.root?.unmount();
	}
}
