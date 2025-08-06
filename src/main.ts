import {
	FileView,
	ItemView,
	MarkdownView,
	OpenViewState,
	Plugin,
	View,
	Workspace,
	WorkspaceLeaf,
	addIcon,
} from "obsidian";
import {
	VerticalTabsView,
	VERTICAL_TABS_VIEW,
} from "src/views/VerticalTabsView";
import { DEFAULT_SETTINGS, Settings } from "./models/PluginSettings";
import { around } from "monkey-around";
import { ZOOM_FACTOR_TOLERANCE } from "./services/TabZoom";
import { useViewState } from "./models/ViewState";
import { ObsidianVerticalTabsSettingTab } from "./views/SettingTab";
import { useSettings } from "./models/PluginContext";
import { nanoid } from "nanoid";
import { patchQuickSwitcher } from "./services/EphemeralTabs";
import { linkTasksStore } from "./stores/LinkTaskStore";
import { parseLink } from "./services/ParseLink";
import { SAFE_DETACH_TIMEOUT } from "./services/CloseTabs";
import { REFRESH_TIMEOUT, REFRESH_TIMEOUT_LONG } from "./constants/Timeouts";
import { PersistenceManager } from "./models/PersistenceManager";
import { migrateAllData } from "./history/Migration";
import { VERTICAL_TABS_ICON } from "./icon";

export default class ObsidianVerticalTabs extends Plugin {
	settings: Settings = DEFAULT_SETTINGS;
	persistenceManager: PersistenceManager;

	async onload() {
		addIcon("vertical-tabs", VERTICAL_TABS_ICON);
		await this.loadSettings();
		await this.setupPersistenceManager();
		await this.registerEventsAndViews();
		await this.setupCommands();
		await this.updateViewStates();
		await this.patchViews();
		this.addSettingTab(new ObsidianVerticalTabsSettingTab(this.app, this));
		setTimeout(() => this.openVerticalTabs(), REFRESH_TIMEOUT);
		this.app.workspace.onLayoutReady(() => {
			setTimeout(
				() => useViewState.getState().refreshToggleButtons(this.app),
				REFRESH_TIMEOUT_LONG
			);
		});
	}

	async setupPersistenceManager() {
		this.persistenceManager = new PersistenceManager(
			this.app,
			// The following assertion is safe because we check for
			// `installationID` in `loadSettings`
			// eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
			this.settings.installationID!,
			this.manifest
		);
		migrateAllData(this);
	}

	async registerEventsAndViews() {
		this.registerView(
			VERTICAL_TABS_VIEW,
			(leaf) => new VerticalTabsView(leaf, this)
		);
	}

	async setupCommands() {
		this.addCommand({
			id: "open-vertical-tabs",
			name: "Open vertical tabs",
			callback: () => {
				this.openVerticalTabs();
				useSettings.getState().toggleBackgroundMode(this.app, false);
			},
		});
	}

	async openVerticalTabs() {
		try {
			const leaf: WorkspaceLeaf =
				this.app.workspace.getLeavesOfType(VERTICAL_TABS_VIEW)[0] ??
				this.app.workspace.getLeftLeaf(false);
			leaf.setViewState({ type: VERTICAL_TABS_VIEW, active: true });
			this.app.workspace.revealLeaf(leaf);
		} catch {
			// do nothing
		}
	}

	onunload() {
		if (this.settings.enhancedKeyboardTabSwitch) {
			useViewState.getState().resetViewCueCallback(this.app);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
		if (!this.settings.installationID) {
			this.settings.installationID = nanoid();
		}
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
		this.toggle("vt-trim-tab-names", this.settings.trimTabNames);
		this.toggle("vt-show-more-buttons", this.settings.showMoreButtons);
		this.toggle("vt-use-tab-editing", this.settings.useTabEditing);
		this.toggle("vt-zen-mode", this.settings.zenMode);
		this.toggle("vt-auto-hide-tabs", this.settings.showActiveTabsInZenMode);
		this.toggle("vt-enable-tab-zoom", this.settings.enableTabZoom);
		this.toggle("vt-ephemeral-tabs", this.settings.ephemeralTabs);
		this.toggle("vt-background-mode", this.settings.backgroundMode);
		this.toggle(
			"vt-mission-control-view-disable-pointer",
			this.settings.disablePointerInMissionControlView
		);
	}

	async patchViews() {
		const applyZoom = (view: View, zoom: number) => {
			if (!this.settings.enableTabZoom) {
				return;
			}
			if (zoom <= 0) return;
			const isNonUnitaryZoom = Math.abs(zoom - 1) > ZOOM_FACTOR_TOLERANCE;
			if (isNonUnitaryZoom) {
				view.containerEl.setCssProps({
					"--vt-tab-zoom-factor": zoom.toString(),
				});
			} else {
				view.containerEl.setCssProps({
					"--vt-tab-zoom-factor": "",
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

		const modifyCanNavigate = (
			target: WorkspaceLeaf,
			fallback: () => boolean
		): boolean => {
			if (this.settings.alwaysOpenInNewTab) {
				return false;
			} else if (
				this.settings.ephemeralTabs ||
				this.settings.smartNavigation
			) {
				const ephemeralTabsecision =
					target.isEphemeral === undefined || target.isEphemeral
						? fallback()
						: false;
				const smartNavigationDecision = useViewState
					.getState()
					.executeSmartNavigation(this.app, target, fallback);
				return ephemeralTabsecision && smartNavigationDecision;
			} else {
				return fallback();
			}
		};

		this.register(
			around(WorkspaceLeaf.prototype, {
				canNavigate(old) {
					return function () {
						return modifyCanNavigate(this, () => old.call(this));
					};
				},
				setParent(old) {
					return function (parent) {
						// If guessedCreationTime is not set, we assume the leaf was created now
						if (!this.guessedCreationTime) {
							this.guessedCreationTime = Date.now();
						}
						old.call(this, parent);
					};
				},
			})
		);

		const modifyDuplicateLeaf = async (
			sourceLeaf: WorkspaceLeaf,
			fallback: () => Promise<WorkspaceLeaf>
		) => {
			return this.settings.deduplicateTabs
				? sourceLeaf
				: await fallback();
		};

		around(Workspace.prototype, {
			openLinkText(old) {
				return async function (
					linkText: string,
					sourcePath: string,
					newLeaf?: boolean,
					openViewState?: OpenViewState
				) {
					const { addTask } = linkTasksStore.getActions();
					const { path, subpath } = parseLink(linkText);
					const name = path ? `${path}.md` : sourcePath;
					addTask(name, subpath);
					return old.call(
						this,
						linkText,
						sourcePath,
						newLeaf,
						openViewState
					);
				};
			},
			duplicateLeaf(next) {
				return async function (...args) {
					return modifyDuplicateLeaf(args[0], () =>
						next.call(this, ...args)
					);
				};
			},
		});

		this.register(
			around(FileView.prototype, {
				close(old) {
					return async function () {
						if (this.isDetachingFromVT) {
							return await setTimeout(
								() => old.call(this),
								SAFE_DETACH_TIMEOUT
							);
						} else {
							return old.call(this);
						}
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

		this.register(patchQuickSwitcher(this.app));
	}
}
