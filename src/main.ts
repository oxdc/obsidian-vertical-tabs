import { ItemView, MarkdownView, Plugin, View, WorkspaceLeaf } from "obsidian";
import { NavigationView, VIEW_TYPE } from "src/navigation";
import { DEFAULT_SETTINGS, Settings } from "./models/PluginSettings";
import { around } from "monkey-around";
import { ZOOM_FACTOR_TOLERANCE } from "./services/TabZoom";

export default class ObsidianVerticalTabs extends Plugin {
	settings: Settings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();
		await this.registerEventsAndViews();
		await this.setupCommands();
		await this.updateViewStates();
		await this.patchViews();
		setTimeout(() => this.openVerticalTabs(), 10);
	}

	async registerEventsAndViews() {
		this.registerView(VIEW_TYPE, (leaf) => new NavigationView(leaf, this));
	}

	async setupCommands() {
		this.addCommand({
			id: "open-vertical-tabs",
			name: "Open vertical tabs",
			callback: () => this.openVerticalTabs(),
		});
	}

	async openVerticalTabs() {
		try {
			const leaf: WorkspaceLeaf =
				this.app.workspace.getLeavesOfType(VIEW_TYPE)[0] ??
				this.app.workspace.getLeftLeaf(false);
			leaf.setViewState({ type: VIEW_TYPE, active: true });
			this.app.workspace.revealLeaf(leaf);
		} catch {
			// do nothing
		}
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

	toggle(classes: string | string[], value: boolean) {
		this.app.workspace.containerEl.doc.body.toggleClass(classes, value);
	}

	async updateViewStates() {
		this.toggle("vt-hide-sidebars", this.settings.hideSidebars);
		this.toggle("vt-show-active-tabs", this.settings.showActiveTabs);
		this.toggle("vt-exclude-self", this.settings.sidebarExcludeSelf);
		this.toggle("vt-zen-mode", this.settings.zenMode);
		this.toggle("vt-enable-tab-zoom", this.settings.enableTabZoom);
	}

	async patchViews() {
		const applyZoom = (view: View, zoom: number) => {
			if (zoom <= 0) return;
			const isNonUnitaryZoom = Math.abs(zoom - 1) > ZOOM_FACTOR_TOLERANCE;
			if (isNonUnitaryZoom) {
				view.containerEl.setCssProps({
					"--vt-tab-zoom-factor": zoom.toString(),
				});
			}
			view.leaf.containerEl?.toggleClass(
				"vt-apply-tab-zoom",
				isNonUnitaryZoom
			);
		};

		this.register(
			around(ItemView.prototype, {
				setEphemeralState(old) {
					return function (eState: object) {
						const newState = { zoom: this.zoom ?? 1, ...eState };
						old.call(this, newState);
						this.zoom = newState.zoom;
						applyZoom(this, this.zoom);
					};
				},
				getEphemeralState(old) {
					return function () {
						const eState = old.call(this);
						this.zoom = this.zoom ?? 1;
						applyZoom(this, this.zoom);
						return { zoom: this.zoom, ...eState };
					};
				},
				onload(old) {
					return function () {
						old.call(this);
						applyZoom(this, this.zoom ?? 1);
					};
				},
			})
		);

		const modifyCanNavigate = (fallback: () => boolean): boolean => {
			if (this.settings.alwaysOpenInNewTab) {
				return false;
			} else {
				return fallback();
			}
		};

		this.register(
			around(WorkspaceLeaf.prototype, {
				canNavigate(old) {
					return function () {
						return modifyCanNavigate(() => old.call(this));
					};
				},
			})
		);

		this.register(
			around(MarkdownView.prototype, {
				getSyncViewState(old) {
					return function () {
						const syncViewState = old.call(this);
						delete syncViewState.eState.zoom;
						return syncViewState;
					};
				},
			})
		);
	}
}
