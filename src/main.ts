import { Plugin, WorkspaceLeaf } from "obsidian";
import { NavigationView, VIEW_TYPE } from "src/navigation";

export default class ObsidianVerticalTabs extends Plugin {
	async onload() {
		this.registerEventsAndViews();
		this.setupCommands();
	}

	async registerEventsAndViews() {
		this.registerView(VIEW_TYPE, (leaf) => new NavigationView(leaf, this));
	}

	async setupCommands() {
		this.addCommand({
			id: "vertical-tabs:open-nav-view",
			name: "Open Navigation View",
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
