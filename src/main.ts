import {
	FileView,
	ItemView,
	MarkdownView,
	OpenViewState,
	Platform,
	Plugin,
	TFile,
	View,
	Workspace,
	WorkspaceLeaf,
	WorkspaceParent,
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
import {
	SAFE_DETACH_TIMEOUT,
	safeDetach,
	TabClosingBehavior,
} from "./services/CloseTabs";
import { REFRESH_TIMEOUT_LONG } from "./constants/Timeouts";
import { PersistenceManager } from "./models/PersistenceManager";
import { migrateAllData } from "./history/Migration";
import { VERTICAL_TABS_ICON } from "./icon";
import { DISABLE_KEY } from "./models/PluginContext";
import { scrollToActiveTab } from "./services/ScrollableTabs";
import { updateOrientationLabel } from "./services/Orientation";
import { getOpenFileOfLeaf } from "./services/GetTabs";
import { managedLeafStore } from "./stores/ManagedLeafStore";
import { isHoverEditorEnabled } from "./services/HoverEditorTabs";
import { removeAllTabControlButtons } from "./services/TabControlButtons";
import { ViewEphemeralState } from "obsidian-typings";

export default class ObsidianVerticalTabs extends Plugin {
	settings: Settings = DEFAULT_SETTINGS;
	persistenceManager!: PersistenceManager;

	async onload() {
		addIcon("vertical-tabs", VERTICAL_TABS_ICON);
		await this.loadSettings();
		await this.setupPersistenceManager();
		const disableOnThisDevice =
			this.persistenceManager.device.get<boolean>(DISABLE_KEY) ?? false;
		if (disableOnThisDevice) {
			void useSettings.getState().loadSettings(this);
			this.addSettingTab(
				new ObsidianVerticalTabsSettingTab(this.app, this)
			);
			return;
		}
		await this.registerEventsAndViews();
		await this.setupCommands();
		await this.updateViewStates();
		await this.patchViews();
		this.addSettingTab(new ObsidianVerticalTabsSettingTab(this.app, this));
		this.app.workspace.onLayoutReady(() => {
			const isPhone = Platform.isPhone;
			const isUnknownMobile = Platform.isMobile && !Platform.isTablet;
			const tabletOrDesktop = Platform.isTablet || Platform.isDesktop;
			const sidebarCollapse = this.app.workspace.leftSplit.collapsed;
			const shouldCollapse =
				isPhone ||
				isUnknownMobile ||
				(tabletOrDesktop && sidebarCollapse);
			void this.openVerticalTabs();
			if (shouldCollapse) {
				window.setTimeout(() =>
					this.app.workspace.leftSplit.collapse()
				);
			}
			window.setTimeout(() => {
				useViewState.getState().refreshToggleButtons(this.app);
			}, REFRESH_TIMEOUT_LONG);
		});
	}

	async setupPersistenceManager() {
		this.persistenceManager = new PersistenceManager(
			this.app,
			this.settings.installationID ?? "", // to be removed
			this.manifest
		);
		migrateAllData(this);
	}

	async registerEventsAndViews() {
		this.registerView(
			VERTICAL_TABS_VIEW,
			(leaf) => new VerticalTabsView(leaf, this)
		);
		this.registerEvents();
	}

	registerEvents() {
		this.registerScrollableTabsEvents();
		this.registerOrientationEvents();
	}

	registerScrollableTabsEvents() {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				scrollToActiveTab(leaf);
			})
		);
		this.registerEvent(
			this.app.workspace.on("editor-change", (_, info) => {
				if (info instanceof MarkdownView) {
					scrollToActiveTab(info.leaf);
				}
			})
		);
	}

	registerOrientationEvents() {
		if (Platform.isPhone) {
			updateOrientationLabel();
			this.registerDomEvent(window, "resize", updateOrientationLabel);
		}
	}

	async setupCommands() {
		this.addCommand({
			id: "open",
			name: "Open",
			callback: () => {
				void this.openVerticalTabs();
				useSettings.getState().toggleBackgroundMode(this.app, false);
			},
		});
	}

	async openVerticalTabs() {
		try {
			const leaf: WorkspaceLeaf | null =
				this.app.workspace.getLeavesOfType(VERTICAL_TABS_VIEW)[0] ??
				this.app.workspace.getLeftLeaf(false);
			if (!leaf) return;
			await leaf.setViewState({ type: VERTICAL_TABS_VIEW, active: true });
			await this.app.workspace.revealLeaf(leaf);
		} catch {
			// do nothing
		}
	}

	onunload() {
		if (this.settings.enhancedKeyboardTabSwitch) {
			useViewState.getState().resetViewCueCallback(this.app);
		}
		removeAllTabControlButtons(this.app);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Settings
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
		this.toggle("vt-scrollable-tabs", this.settings.scrollableTabs);
		this.toggle(
			"vt-auto-hide-horizontal-tabs",
			this.settings.autoHideHorizontalTabs
		);
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
		this.toggle("vt-prefer-new-tab", this.settings.alwaysOpenInNewTab);
		this.toggle(
			"vt-allow-workspace-split",
			this.settings.allowWorkspaceSplitOnPhone
		);

		// Limit visible groups to 2 when allowWorkspaceSplitOnPhone is enabled on mobile
		if (Platform.isMobile && this.settings.allowWorkspaceSplitOnPhone) {
			window.setTimeout(() =>
				useViewState.getState().limitVisibleGroupsOnPhone(this.app)
			);
		}
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
					return function (
						this: ItemView & { zoom?: number },
						eState: ViewEphemeralState
					) {
						const newState = { zoom: this.zoom ?? 1, ...eState };
						old.call(this, newState);
						this.zoom = newState.zoom;
						applyZoom(this, this.zoom);
					};
				},
				getEphemeralState(old) {
					return function (this: ItemView & { zoom?: number }) {
						const eState = old.call(this);
						this.zoom = this.zoom ?? 1;
						applyZoom(this, this.zoom);
						return { zoom: this.zoom, ...eState };
					};
				},
				onload(old) {
					return function (this: ItemView & { zoom?: number }) {
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

		const modifyOpenFile = async (
			target: WorkspaceLeaf,
			file: TFile,
			openState: OpenViewState,
			fallback: (
				target: WorkspaceLeaf,
				file: TFile,
				openState?: OpenViewState
			) => Promise<void>
		) => {
			const {
				deduplicateTabs,
				deduplicateSameGroupTabs,
				deduplicateSidebarTabs,
				deduplicatePopupTabs,
			} = this.settings;
			if (!deduplicateTabs) return fallback(target, file, openState);
			let found = false;
			const callback = (leaf: WorkspaceLeaf) => {
				if (leaf.id === target.id || found) return;
				// prettier-ignore
				if (managedLeafStore.getState().actions.isManagedLeaf(this.app, leaf)) return;
				// prettier-ignore
				if (!deduplicateSidebarTabs && (leaf.getRoot() === this.app.workspace.leftSplit || leaf.getRoot() === this.app.workspace.rightSplit)) return;
				// prettier-ignore
				if (!deduplicatePopupTabs && leaf.getRoot() === this.app.workspace.floatingSplit) return;
				// prettier-ignore
				if (deduplicateSameGroupTabs && leaf.parent.id !== target.parent.id) return;
				const leafFile = getOpenFileOfLeaf(this.app, leaf);
				if (leafFile && leafFile.path === file.path) {
					found = true;
					void fallback(leaf, file, openState);
					this.app.workspace.setActiveLeaf(leaf, { focus: false });
					safeDetach(target);
				}
			};
			this.app.workspace.iterateAllLeaves(callback);
			if (!found) return fallback(target, file, openState);
		};

		const modifyDetach = (target: WorkspaceLeaf) => {
			const parent = target.parent;
			switch (this.settings.tabClosingBehavior) {
				case TabClosingBehavior.ActiveLeft:
					parent.selectTabIndex(parent.currentTab - 1);
					break;
				case TabClosingBehavior.ActiveRight:
					parent.selectTabIndex(parent.currentTab + 1);
					break;
				case TabClosingBehavior.ActiveRecent: {
					let recentTabIndex = Math.max(0, parent.currentTab - 1);
					let recentActiveTime = -1;
					parent.children.forEach((leaf, index) => {
						if (leaf === target) return;
						const activeTime = leaf.activeTime ?? 0;
						if (activeTime > recentActiveTime) {
							recentTabIndex = index;
							recentActiveTime = activeTime;
						}
					});
					target.parent.selectTabIndex(recentTabIndex);
					break;
				}
			}
		};

		this.register(
			around(WorkspaceLeaf.prototype, {
				canNavigate(old) {
					return function (this: WorkspaceLeaf) {
						return modifyCanNavigate(this, () => old.call(this));
					};
				},
				setParent(old) {
					return function (
						this: WorkspaceLeaf,
						parent: WorkspaceParent
					) {
						// If guessedCreationTime is not set, we assume the leaf was created now
						if (!this.guessedCreationTime) {
							this.guessedCreationTime = Date.now();
						}
						old.call(this, parent);
					};
				},
				openFile(old) {
					return function (
						this: WorkspaceLeaf,
						file: TFile,
						openState?: OpenViewState
					) {
						const fallback = (
							target: WorkspaceLeaf,
							file: TFile,
							openState?: OpenViewState
						) => old.call(target, file, openState);
						if (isHoverEditorEnabled(this.app)) {
							if (!this.parent.parentSplit)
								return fallback(this, file, openState);
						}
						if (openState) {
							void modifyOpenFile(
								this,
								file,
								openState,
								fallback
							);
						} else {
							return fallback(this, file, openState);
						}
						return fallback(this, file, openState);
					};
				},
				detach(old) {
					return function (this: WorkspaceLeaf) {
						modifyDetach(this);
						old.call(this);
					};
				},
			})
		);

		around(Workspace.prototype, {
			openLinkText(old) {
				return async function (
					this: Workspace,
					linkText: string,
					sourcePath: string,
					newLeaf?: boolean,
					openViewState?: OpenViewState
				) {
					const { addOpenLinkTextTask } = linkTasksStore.getActions();
					const { path, subpath } = parseLink(linkText);
					const name = path ? `${path}.md` : sourcePath;
					addOpenLinkTextTask(name, subpath);
					return old.call(
						this,
						linkText,
						sourcePath,
						newLeaf,
						openViewState
					);
				};
			},
		});

		this.register(
			around(FileView.prototype, {
				close(old) {
					return async function (this: FileView) {
						if (this.isDetachingFromVT) {
							window.setTimeout(
								() => void old.call(this),
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
					return function (this: MarkdownView) {
						const syncViewState = old.call(this);
						delete (syncViewState.eState as { zoom?: number }).zoom;
						return syncViewState;
					};
				},
			})
		);

		this.register(patchQuickSwitcher(this.app));
	}
}
