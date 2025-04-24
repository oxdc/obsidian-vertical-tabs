import { App, Platform, PluginSettingTab, Setting } from "obsidian";
import ObsidianVerticalTabs from "../main";
import { useSettings } from "../models/PluginContext";
import { EVENTS } from "../constants/Events";
import {
	TabNavigationPresets,
	TabNavigationStrategy,
	TabNavigationStrategyOptions,
	TabNavigationCopyOptions,
} from "../models/TabNavigation";
import { linkedFolderSortStrategyOptions } from "../services/OpenFolder";

export class ObsidianVerticalTabsSettingTab extends PluginSettingTab {
	plugin: ObsidianVerticalTabs;

	constructor(app: App, plugin: ObsidianVerticalTabs) {
		super(app, plugin);
		this.plugin = plugin;
	}

	private refresh() {
		const scorllTop = this.containerEl.scrollTop;
		this.display();
		this.containerEl.scrollTop = scorllTop;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		if (this.plugin.settings.backgroundMode) {
			const warning = containerEl.createDiv({
				cls: "vt-background-mode-warning",
			});
			warning.appendText(`
				* Warning: Background mode is enabled.
				To see Vertical Tabs and access its core features,
				you must first 
			`);
			const linkButton = warning.createEl("a", {
				text: "disable",
			});
			linkButton.onclick = () => {
				useSettings.getState().toggleBackgroundMode(this.app, false);
				this.refresh();
			};
			warning.appendText(" it.");
		}

		if (!this.plugin.settings.backgroundMode) {
			new Setting(containerEl)
				.setName("Show active tabs only")
				.setDesc(
					"Hide inactive horizontal tabs to make workspace cleaner."
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.showActiveTabs)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ showActiveTabs: value });
						});
				});

			new Setting(containerEl)
				.setName("Hide inactive tabs in Zen Mode")
				.setDesc(
					"Hide inactive horizontal tabs when Zen Mode is enabled."
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.showActiveTabsInZenMode)
						.onChange(async (value) => {
							useSettings.getState().setSettings({
								showActiveTabsInZenMode: value,
							});
						});
				});

			new Setting(containerEl)
				.setName("Auto uncollapse active group")
				.setDesc(
					"Automatically uncollapse the active groups when switching tabs."
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.autoUncollapseGroup)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ autoUncollapseGroup: value });
						});
				});

			new Setting(containerEl)
				.setName("Hide sidebar tabs")
				.setDesc("Don't show sidebar tabs in Vertical Tabs.")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.hideSidebars)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ hideSidebars: value });
						});
				});

			new Setting(containerEl)
				.setName("Trim tab names")
				.setDesc("Use ellipsis to fit tab names on a single line.")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.trimTabNames)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ trimTabNames: value });
						});
				});

			new Setting(containerEl)
				.setName("Show more actions")
				.setDesc("Show more control buttons in the toolbar.")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.showMoreButtons)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ showMoreButtons: value });
						});
				});

			if (Platform.isMobile) {
				new Setting(containerEl)
					.setName("Mobile action preference")
					.setDesc(
						this.plugin.settings.useTabEditing
							? "Enable tab editing mode to show control buttons on mobile."
							: "Show control buttons such as new-tab buttons and close icons on mobile."
					)
					.addDropdown((dropdown) =>
						dropdown
							.addOption("show-all", "Show all buttons")
							.addOption("tab-editing", "Enable tab editing mode")
							.setValue(
								this.plugin.settings.useTabEditing
									? "tab-editing"
									: "show-all"
							)
							.onChange(async (value) => {
								useSettings.getState().setSettings({
									useTabEditing: value === "tab-editing",
								});
								this.refresh();
							})
					);
			}
		}

		new Setting(containerEl)
			.setName("Enable tab zoom")
			.setDesc("Enable per tab zooming.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableTabZoom)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ enableTabZoom: value });
					});
			});

		if (!this.plugin.settings.backgroundMode) {
			new Setting(containerEl).setName("Tab switching").setHeading();

			new Setting(containerEl)
				.setName("Enhanced keyboard tab switching")
				.setDesc("Use Ctrl/Cmd + 1-9 to switch between tabs.")
				.addToggle((toggle) => {
					toggle
						.setValue(
							this.plugin.settings.enhancedKeyboardTabSwitch
						)
						.onChange(async (value) => {
							useSettings
								.getState()
								.toggleEnhancedKeyboardTabSwitch(
									this.app,
									value
								);
						});
				});
		}

		new Setting(containerEl).setName("Tab navigation").setHeading();

		new Setting(containerEl)
			.setName("Navigation strategy")
			.setDesc(
				"Controls the navigation behavior when new notes are opened."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(TabNavigationStrategyOptions)
					.setValue(this.plugin.settings.navigationStrategy)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setTabNavigationStrategy(this.app, value);
						this.refresh();
					})
			);

		switch (this.plugin.settings.navigationStrategy) {
			case TabNavigationStrategy.Obsidian:
				containerEl.createDiv({
					cls: "vt-navigation-description",
					text: `
						Use the default navigation strategy of Obsidian.
						When working with multiple tab groups, 
						new tabs may appear in unexpected locations.
					`,
				});
				break;
			case TabNavigationStrategy.ObsidianPlus:
				containerEl.createDiv({
					cls: "vt-navigation-description",
					text: `
						Use enhanced navigation strategy implemented by Vertical Tabs. 
						New tabs will be opened in a consistent and intuitive manner.
					`,
				});
				break;
			case TabNavigationStrategy.IDE:
				containerEl.createDiv({
					cls: "vt-navigation-description",
					text: `
						Use IDE-like navigation strategy. 
						Recommended for users familiar with VSCode, Xcode, or other IDEs.
					`,
				});
				break;
			case TabNavigationStrategy.Explorer:
				containerEl.createDiv({
					cls: "vt-navigation-description",
					text: `
						Explorer mode uses ephemeral tabs to avoid opening too many tabs.
					`,
				});
				break;
			case TabNavigationStrategy.Notebook:
				containerEl.createDiv({
					cls: "vt-navigation-description",
					text: `
						Notebook mode ensures consistent navigation behavior while avoiding duplication.
					`,
				});
				break;
			case TabNavigationStrategy.PreferNewTab:
				containerEl.createDiv({
					cls: "vt-navigation-description",
					text: `
						Always open the new note in a new tab.
					`,
				});
				break;
			case TabNavigationStrategy.Custom:
				this.displayCustomNavigationStrategy(containerEl);
				break;
		}

		new Setting(containerEl).setName("Linked Folder").setHeading();

		new Setting(containerEl)
			.setName("Load order")
			.setDesc(
				"Determines the order in which files are loaded, such as by name or date."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(linkedFolderSortStrategyOptions)
					.setValue(this.plugin.settings.linkedFolderSortStrategy)
					.onChange(async (value) => {
						useSettings.getState().setSettings({
							linkedFolderSortStrategy: value,
						});
					})
			);

		new Setting(containerEl)
			.setName("Files per load")
			.setDesc("Files loaded per click when opening a folder as a group.")
			.addExtraButton((button) => {
				button
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(async () => {
						useSettings.getState().setSettings({
							linkedFolderLimit: 5,
						});
						this.display();
					});
			})
			.addSlider((slider) => {
				slider
					.setLimits(5, 50, 1)
					.setValue(this.plugin.settings.linkedFolderLimit)
					.setDynamicTooltip()
					.onChange(async (value) => {
						useSettings.getState().setSettings({
							linkedFolderLimit: value,
						});
					});
			});

		new Setting(containerEl).setName("Group View").setHeading();

		new Setting(containerEl)
			.setName("Show metadata in continuous view")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.continuousViewShowMetadata)
					.onChange(async (value) => {
						useSettings.getState().setGroupViewOptions(this.app, {
							continuousViewShowMetadata: value,
						});
					});
			});

		new Setting(containerEl)
			.setName("Show backlinks in continuous view")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.continuousViewShowBacklinks)
					.onChange(async (value) => {
						useSettings.getState().setGroupViewOptions(this.app, {
							continuousViewShowBacklinks: value,
						});
					});
			});

		new Setting(containerEl)
			.setName("Column view tab width")
			.setDesc("Minimum width of each tab in the column view in pixels.")
			.addExtraButton((button) => {
				button
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(async () => {
						useSettings.getState().setGroupViewOptions(this.app, {
							columnViewMinWidth: 300,
						});
						this.display();
					});
			})
			.addSlider((slider) => {
				slider
					.setLimits(200, 1000, 10)
					.setValue(this.plugin.settings.columnViewMinWidth)
					.setDynamicTooltip()
					.onChange(async (value) => {
						useSettings.getState().setGroupViewOptions(this.app, {
							columnViewMinWidth: value,
						});
					});
			});

		new Setting(containerEl)
			.setName("Zoom factor in mission control view")
			.setDesc("Adjust the page size in mission control view.")
			.addExtraButton((button) => {
				button
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(async () => {
						useSettings.getState().setGroupViewOptions(this.app, {
							missionControlViewZoomFactor: 0.5,
						});
						this.display();
					});
			})
			.addSlider((slider) => {
				slider
					.setLimits(0.5, 1, 0.1)
					.setValue(this.plugin.settings.missionControlViewZoomFactor)
					.setDynamicTooltip()
					.onChange(async (value) => {
						useSettings.getState().setGroupViewOptions(this.app, {
							missionControlViewZoomFactor: value,
						});
					});
			});

		new Setting(containerEl)
			.setName("Disable pointer in mission control view")
			.setDesc(
				"Prevents interaction with tab content when in mission control view, allowing easier navigation between tabs."
			)
			.addToggle((toggle) => {
				toggle
					.setValue(
						this.plugin.settings.disablePointerInMissionControlView
					)
					.onChange(async (value) => {
						useSettings.getState().setSettings({
							disablePointerInMissionControlView: value,
						});
					});
			});

		new Setting(containerEl).setName("Miscellaneous").setHeading();

		new Setting(containerEl)
			.setName("Background mode")
			.setDesc(
				`Enable to keep features like tab navigation without showing vertical tabs.
				This will disable Zen Mode and reset your workspace to the default layout.`
			)
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.backgroundMode)
					.onChange(async () => {
						useSettings.getState().toggleBackgroundMode(this.app);
						this.refresh();
					});
			});

		containerEl.createDiv({ cls: "vt-support" }).innerHTML = `
			<div class="title">Enjoying Vertical Tabs?</div>
			<div class="buttons">
				<a id="vt-support-btn-kofi" href="https://ko-fi.com/oxdcq" target="_blank">
					<img
						height="16"
						border="0"
						style="border: 0px; height: 16px;"
						src="https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png"
					/>
					<span>Buy me a coffee</span>
				</a>
				<a id="vt-support-btn-github" href="https://github.com/oxdc/obsidian-vertical-tabs" target="_blank">
					<img
						height="16"
						border="0"
						style="border: 0px; height: 16px;"
						src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
					/>
					<span>Star on GitHub</span>
				</a>
			</div>
			<div class="bug-report">
				Facing issues or have suggestions? <a href="https://github.com/oxdc/obsidian-vertical-tabs/issues/new/choose" target="_blank">Submit a report</a>.
			</div>
		`;
	}

	private displayCustomNavigationStrategy(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Copy from existing strategy")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(TabNavigationCopyOptions)
					.setValue("--copy--")
					.onChange(async (value) => {
						if (value === "--copy--") return;
						const preset = value as TabNavigationStrategy;
						useSettings
							.getState()
							.setTabNavigationStrategy(
								this.app,
								TabNavigationStrategy.Custom,
								TabNavigationPresets[preset]
							);
						this.refresh();
					})
			)
			.addExtraButton((button) =>
				button
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(async () => {
						useSettings
							.getState()
							.setTabNavigationStrategy(
								this.app,
								TabNavigationStrategy.Custom
							);
						this.refresh();
					})
			);

		new Setting(containerEl)
			.setName("Always open in new tab")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.alwaysOpenInNewTab)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ alwaysOpenInNewTab: value });
						this.refresh();
					});
			});

		if (!this.plugin.settings.alwaysOpenInNewTab) {
			new Setting(containerEl)
				.setName("Smart navigation")
				.setDesc(
					"Ensures consistent and intuitive behavior when working with multiple tab groups."
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.smartNavigation)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ smartNavigation: value });
						});
				});

			new Setting(containerEl)
				.setName("Enable ephemeral tabs")
				.setDesc("Bring VSCode-like ephemeral tabs to Obsidian.")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.ephemeralTabs)
						.onChange(async (value) => {
							useSettings.getState().setSettings({
								ephemeralTabs: value,
								autoCloseEphemeralTabs: true,
							});
							if (value) {
								this.app.workspace.trigger(
									EVENTS.EPHEMERAL_TABS_INIT,
									true
								);
							} else {
								this.app.workspace.trigger(
									EVENTS.EPHEMERAL_TABS_DEINIT
								);
							}
							this.refresh();
						});
				});

			if (this.plugin.settings.ephemeralTabs) {
				new Setting(containerEl)
					.setName("Auto close ephemeral tabs")
					.setDesc(
						"Close inactive ephemeral tabs automatically and merge their history."
					)
					.addToggle((toggle) => {
						toggle
							.setValue(
								this.plugin.settings.autoCloseEphemeralTabs
							)
							.onChange(async (value) => {
								useSettings.getState().setSettings({
									autoCloseEphemeralTabs: value,
								});
								this.app.workspace.trigger(
									EVENTS.EPHEMERAL_TABS_UPDATE,
									true,
									value
								);
							});
					});
			}
		}

		new Setting(containerEl)
			.setName("Deduplicate tabs")
			.setDesc("Prevent opening the same note in multiple tabs.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.deduplicateTabs)
					.onChange(async (value) => {
						useSettings.getState().setSettings({
							deduplicateTabs: value,
							deduplicateSameGroupTabs: false,
							deduplicateSidebarTabs: false,
							deduplicatePopupTabs: false,
						});
						if (value) {
							this.app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
						}
						this.refresh();
					});
			});

		if (this.plugin.settings.deduplicateTabs) {
			new Setting(containerEl)
				.setName("Deduplicate only same-group tabs")
				.setDesc(
					"Perform deduplication only within the same tab group."
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.deduplicateSameGroupTabs)
						.onChange(async (value) => {
							useSettings.getState().setSettings({
								deduplicateSameGroupTabs: value,
							});
							this.app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
						});
				});

			new Setting(containerEl)
				.setName("Deduplicate sidebar tabs")
				.setDesc("Prevent duplicated tabs in the sidebars.")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.deduplicateSidebarTabs)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ deduplicateSidebarTabs: value });
							this.app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
						});
				});

			new Setting(containerEl)
				.setName("Deduplicate popup tabs")
				.setDesc("Prevent duplicated tabs in popup windows.")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.deduplicatePopupTabs)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ deduplicatePopupTabs: value });
							this.app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
						});
				});
		}
	}
}
