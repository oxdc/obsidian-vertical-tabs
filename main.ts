import { Plugin, WorkspaceLeaf } from "obsidian";
import { VerticalTabsView, VIEW_TYPE } from "src/ui";

export default class ObsidianVerticalTabs extends Plugin {
	async onload() {
		this.registerEventsAndViews();
		this.setupCommands();
	}

	async registerEventsAndViews() {
		this.registerView(VIEW_TYPE, (leaf) => new VerticalTabsView(leaf));
	}

	async setupCommands() {
		this.addCommand({
			id: "open-vertical-tabs",
			name: "Open Vertical Tabs",
			callback: () => {
				const leaf: WorkspaceLeaf =
					this.app.workspace.getLeavesOfType(VIEW_TYPE)[0] ??
					this.app.workspace.getLeftLeaf(false);
				leaf.setViewState({ type: VIEW_TYPE, active: true });
				this.app.workspace.revealLeaf(leaf);
			},
		});
	}

	onunload() {}
}
