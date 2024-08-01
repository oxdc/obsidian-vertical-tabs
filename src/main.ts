import { Plugin, WorkspaceLeaf } from "obsidian";
import { NavigationView, VIEW_TYPE } from "src/navigation";
import { DEFAULT_SETTINGS, Settings } from "./models/PluginSettings";

export default class ObsidianVerticalTabs extends Plugin {
	settings: Settings = DEFAULT_SETTINGS;

	async onload() {
		this.loadSettings();
		this.registerEventsAndViews();
		this.setupCommands();
	}

	async registerEventsAndViews() {
		this.registerView(VIEW_TYPE, (leaf) => new NavigationView(leaf, this));
	}

	async setupCommands() {
		this.addCommand({
			id: "vertical-tabs:open-vertical-tabs",
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

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
