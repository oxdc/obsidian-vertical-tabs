import {
	App,
	Notice,
	Platform,
	PluginSettingTab,
	setIcon,
	Setting,
} from "obsidian";
import ObsidianVerticalTabs from "../main";
import { DISABLE_KEY, useSettings } from "../models/PluginContext";
import { EVENTS } from "../constants/Events";
import {
	TabNavigationPresets,
	TabNavigationStrategy,
	TabNavigationStrategyOptions,
	TabNavigationCopyOptions,
	TabNavigationStrategyDescriptions,
	TabNavigationStrategySettings,
} from "../models/TabNavigation";
import { linkedFolderSortStrategyOptions } from "../services/OpenFolder";
import { getLatestVersion } from "src/services/Version";
import * as semver from "semver";
import { VERTICAL_TABS_VIEW } from "./VerticalTabsView";

interface ToggleProps {
	name: string;
	desc?: string;
	value: boolean;
	onChange: (value: boolean) => void;
}

interface SliderProps {
	name: string;
	desc?: string;
	value: {
		currentValue: number;
		defaultValue: number;
		limits: { min: number; max: number; step: number };
	};
	onChange: (value: number) => void;
	onReset?: () => void;
}

interface DropdownProps {
	name: string;
	desc?: string;
	options: Record<string, string>;
	value: string;
	onChange: (value: string) => void;
	onReset?: () => void;
}

interface WarningBannerProps {
	template: string;
	onClick: () => void;
}

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

		const store = this.plugin.persistenceManager.device;
		const disableOnThisDevice = store.get<boolean>(DISABLE_KEY) ?? false;

		this.displayUpdateIndicator(containerEl);

		if (this.plugin.settings.backgroundMode) {
			this.displayBackgroundModeWarningBanner(containerEl);
		}

		if (disableOnThisDevice) {
			this.displayPluginDisabledWarningBanner(containerEl);
		}

		if (!disableOnThisDevice && !this.plugin.settings.backgroundMode) {
			this.displayBasicSettingsSection(containerEl);
			this.displayHorizontalTabControlSection(containerEl);
			this.displayNavigationStrategySection(containerEl);
			this.displayLinkedFolderSection(containerEl);
			this.displayGroupViewSection(containerEl);
		}

		this.displayMiscellaneousSection(containerEl);
		this.displaySupportSection(containerEl);
	}

	// Setting Components

	private createToggle(parentEl: HTMLElement, props: ToggleProps) {
		const { name, desc, value, onChange } = props;
		const toggleEl = new Setting(parentEl)
			.setName(name)
			.addToggle((toggle) => {
				toggle.setValue(value).onChange(onChange);
			});
		if (desc) toggleEl.setDesc(desc);
		return toggleEl;
	}

	private createSlider(parentEl: HTMLElement, props: SliderProps) {
		const { name, desc, value, onChange, onReset } = props;
		const { currentValue, defaultValue, limits } = value;
		const resetHandler = onReset ?? (() => onChange(defaultValue));
		const sliderEl = new Setting(parentEl)
			.setName(name)
			.addExtraButton((button) => {
				button
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(() => {
						resetHandler();
						this.refresh();
					});
			})
			.addSlider((slider) => {
				slider
					.setLimits(limits.min, limits.max, limits.step)
					.setValue(currentValue)
					.setDynamicTooltip()
					.onChange(onChange);
			});
		if (desc) sliderEl.setDesc(desc);
		return sliderEl;
	}

	private createDropdown(parentEl: HTMLElement, props: DropdownProps) {
		const { name, desc, options, value, onChange, onReset } = props;
		const dropdownEl = new Setting(parentEl)
			.setName(name)
			.addDropdown((dropdown) =>
				dropdown.addOptions(options).setValue(value).onChange(onChange)
			);
		if (desc) dropdownEl.setDesc(desc);
		if (onReset) {
			dropdownEl.addExtraButton((button) =>
				button
					.setIcon("reset")
					.setTooltip("Reset to default")
					.onClick(onReset)
			);
		}
		return dropdownEl;
	}

	// Update Checker

	private displayUpdateIndicator(containerEl: HTMLElement) {
		const entry = new Setting(containerEl).setName("Updates");
		if (this.isBetaVersion(this.plugin.manifest.version)) {
			entry.descEl.innerHTML = `
				You are running beta version ${this.plugin.manifest.version}.
				Beta updates are managed by the
				<a href="https://github.com/oxdc/obsidian-vertical-tabs-beta-helper" target="_blank">Beta Helper</a>
				plugin. For more information, please refer to the
				<a href="https://oxdc.github.io/obsidian-vertical-tabs-docs/Beta-Versions/beta-program" target="_blank">Beta Program documentation</a>.
			`;
		} else {
			const indicator = entry.controlEl.createDiv();
			this.showLoadingState(entry, indicator);
			this.checkForUpdates(entry, indicator);
		}
	}

	private isBetaVersion(version: string): boolean {
		return version.includes("-beta-");
	}

	private showLoadingState(entry: Setting, indicator: HTMLElement) {
		entry.setDesc("Checking for updates...");
		entry.settingEl.toggleClass("mod-toggle", true);
		indicator.className = "vt-update-indicator mod-loading";
		setIcon(indicator, "refresh-ccw");
	}

	private async checkForUpdates(entry: Setting, indicator: HTMLElement) {
		try {
			const versions = await getLatestVersion(this.plugin);
			const { currentVersion, latestVersion } = versions;
			if (!latestVersion) {
				this.showErrorState(entry, indicator);
			} else if (semver.lt(currentVersion, latestVersion)) {
				this.showUpdateAvailable(
					entry,
					indicator,
					currentVersion,
					latestVersion
				);
			} else {
				this.showUpToDateState(entry, indicator, currentVersion);
			}
		} catch (error) {
			this.showErrorState(entry, indicator);
		}
	}

	private showErrorState(entry: Setting, indicator: HTMLElement) {
		entry.setDesc(
			"Failed to check for updates. Please check your internet connection."
		);
		entry.settingEl.toggleClass("mod-toggle", true);
		indicator.className = "vt-update-indicator mod-error";
		setIcon(indicator, "circle-x");
	}

	private showUpdateAvailable(
		entry: Setting,
		indicator: HTMLElement,
		currentVersion: string,
		latestVersion: string
	) {
		entry.setDesc(
			`New version available! You have ${currentVersion}, latest is ${latestVersion}. `
		);
		this.addReleaseNotesLink(entry, latestVersion);
		this.addPluginStoreButton(entry);
		entry.settingEl.toggleClass("mod-toggle", false);
		indicator.hide();
	}

	private showUpToDateState(
		entry: Setting,
		indicator: HTMLElement,
		currentVersion: string
	) {
		entry.setDesc(`You're up to date! Current version: ${currentVersion}`);
		entry.settingEl.toggleClass("mod-toggle", true);
		indicator.className = "vt-update-indicator mod-success";
		setIcon(indicator, "circle-check");
	}

	private addReleaseNotesLink(entry: Setting, latestVersion: string) {
		const releaseUrl = `https://github.com/oxdc/obsidian-vertical-tabs/releases/tag/${latestVersion}`;
		const linkHtml = `<a href="${releaseUrl}" target="_blank" rel="noopener noreferrer">Release notes</a>`;
		entry.descEl.createSpan().innerHTML = linkHtml;
	}

	private addPluginStoreButton(entry: Setting) {
		const pluginId = this.plugin.manifest.id;
		const url = `obsidian://show-plugin?id=${pluginId}`;
		const showPage = () =>
			window.open(url, "_blank", "noopener noreferrer");
		entry.addButton((button) => {
			button
				.setButtonText("View in plugin store")
				.setCta()
				.onClick(showPage);
		});
	}

	// Warning Banners

	private displayBackgroundModeWarningBanner(containerEl: HTMLElement) {
		this.createWarningBanner(containerEl, {
			template: `Background mode is enabled. To see Vertical Tabs and access its core features,
								 you must first {disable} it.`,
			onClick: () => this.toggleBackgroundMode(false),
		});
	}

	private displayPluginDisabledWarningBanner(containerEl: HTMLElement) {
		this.createWarningBanner(containerEl, {
			template: `Vertical Tabs is disabled on this device. To access plugin features and settings,
							   you must first {enable} it.`,
			onClick: () => this.toggleDisableOnThisDevice(false),
		});
	}

	private createWarningBanner(
		containerEl: HTMLElement,
		props: WarningBannerProps
	) {
		const { template, onClick } = props;
		// template format: "prefix {buttonText} suffix"
		const buttonTextMatch = template.match(/\{([^}]+)\}/);
		const buttonText = buttonTextMatch ? buttonTextMatch[1] : "";
		const [prefix, suffix] = template.split(/\{[^}]+\}/);
		const warning = containerEl.createDiv({ cls: "vt-warning-banner" });
		warning.appendText(`* Warning: ${prefix}`);
		const linkButton = warning.createEl("a", { text: buttonText });
		warning.appendText(suffix);
		linkButton.onclick = () => {
			onClick();
			this.refresh();
		};
	}

	// Basic Settings

	private displayBasicSettingsSection(containerEl: HTMLElement) {
		this.displayCommonSettingsSection(containerEl);
		if (Platform.isMobile) {
			this.displayMobileSettingsSection(containerEl);
		}
	}

	private displayCommonSettingsSection(containerEl: HTMLElement) {
		this.displayVisualOptions(containerEl);
		this.displayTabZoomOptions(containerEl);
	}

	private displayVisualOptions(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Hide sidebar tabs",
			desc: "Don't show sidebar tabs in Vertical Tabs.",
			value: this.plugin.settings.hideSidebars,
			onChange: (value) => {
				useSettings.getState().setSettings({ hideSidebars: value });
			},
		});

		this.createToggle(containerEl, {
			name: "Trim tab names",
			desc: "Use ellipsis to fit tab names on a single line.",
			value: this.plugin.settings.trimTabNames,
			onChange: (value) => {
				useSettings.getState().setSettings({ trimTabNames: value });
			},
		});

		this.createToggle(containerEl, {
			name: "Auto uncollapse active group",
			desc: "Automatically uncollapse the active groups when switching tabs.",
			value: this.plugin.settings.autoUncollapseGroup,
			onChange: (value) => {
				useSettings
					.getState()
					.setSettings({ autoUncollapseGroup: value });
			},
		});

		this.createToggle(containerEl, {
			name: "Show more actions",
			desc: "Show more control buttons in the toolbar.",
			value: this.plugin.settings.showMoreButtons,
			onChange: (value) => {
				useSettings.getState().setSettings({ showMoreButtons: value });
			},
		});
	}

	private displayTabZoomOptions(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Enable tab zoom",
			desc: "Enable per tab zooming.",
			value: this.plugin.settings.enableTabZoom,
			onChange: (value) =>
				useSettings.getState().setSettings({ enableTabZoom: value }),
		});
	}

	private displayMobileSettingsSection(containerEl: HTMLElement) {
		this.createDropdown(containerEl, {
			name: "Mobile action preference",
			desc: this.plugin.settings.useTabEditing
				? "Enable tab editing mode to show control buttons on mobile."
				: "Show control buttons such as new-tab buttons and close icons on mobile.",
			options: {
				"show-all": "Show all buttons",
				"tab-editing": "Enable tab editing mode",
			},
			value: this.plugin.settings.useTabEditing
				? "tab-editing"
				: "show-all",
			onChange: (value) => {
				useSettings.getState().setSettings({
					useTabEditing: value === "tab-editing",
				});
				this.refresh();
			},
		});
	}

	// Horizontal Tab Control

	private displayHorizontalTabControlSection(containerEl: HTMLElement) {
		new Setting(containerEl).setName("Horizontal tab control").setHeading();

		this.displayHorizontalTabsOptions(containerEl);
		this.displayEnhancedKeyboardTabSwitchToggle(containerEl);

		if (!this.plugin.settings.showActiveTabs) {
			this.displayScrollableTabsToggle(containerEl);
			if (this.plugin.settings.scrollableTabs) {
				this.displayScrollableTabsOptions(containerEl);
			}
		}
	}

	private displayHorizontalTabsOptions(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Show active tabs only",
			desc: "Hide inactive horizontal tabs to make workspace cleaner.",
			value: this.plugin.settings.showActiveTabs,
			onChange: (value) => {
				useSettings.getState().setSettings({
					showActiveTabs: value,
				});
				this.refresh();
			},
		});

		this.createToggle(containerEl, {
			name: "Auto hide horizontal tabs",
			desc: "Automatically hide horizontal tabs when the left sidebar is open.",
			value: this.plugin.settings.autoHideHorizontalTabs,
			onChange: (value) => {
				useSettings.getState().setSettings({
					autoHideHorizontalTabs: value,
				});
			},
		});

		this.createToggle(containerEl, {
			name: "Hide inactive tabs in Zen Mode",
			desc: "Hide inactive horizontal tabs when Zen Mode is enabled.",
			value: this.plugin.settings.showActiveTabsInZenMode,
			onChange: (value) => {
				useSettings.getState().setSettings({
					showActiveTabsInZenMode: value,
				});
			},
		});
	}

	private displayEnhancedKeyboardTabSwitchToggle(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Enhanced keyboard tab switching",
			desc: "Use Ctrl/Cmd + 1-9 to switch between tabs.",
			value: this.plugin.settings.enhancedKeyboardTabSwitch,
			onChange: (value) =>
				useSettings
					.getState()
					.toggleEnhancedKeyboardTabSwitch(this.app, value),
		});
	}

	private displayScrollableTabsToggle(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Scrollable tabs",
			desc: "Enable horizontal scrolling for tab headers when they exceed available width.",
			value: this.plugin.settings.scrollableTabs,
			onChange: (value) => {
				useSettings.getState().setSettings({ scrollableTabs: value });
				this.refresh();
			},
		});
	}

	private displayScrollableTabsOptions(containerEl: HTMLElement) {
		this.createSlider(containerEl, {
			name: "Tab minimum width",
			desc: "Minimum width of each tab header in pixels.",
			value: {
				currentValue: this.plugin.settings.scrollableTabsMinWidth,
				defaultValue: 100,
				limits: { min: 50, max: 300, step: 10 },
			},
			onChange: (value) =>
				useSettings.getState().setScrollableTabsMinWidth(value),
		});
	}

	// Navigation Strategy

	private displayNavigationStrategySection(containerEl: HTMLElement) {
		new Setting(containerEl).setName("Tab navigation").setHeading();

		this.createDropdown(containerEl, {
			name: "Navigation strategy",
			desc: "Controls the navigation behavior when new notes are opened.",
			options: TabNavigationStrategyOptions,
			value: this.plugin.settings.navigationStrategy,
			onChange: (value) => this.updateNavigationStrategy(value),
		});

		const isCustomStrategy =
			this.plugin.settings.navigationStrategy ==
			TabNavigationStrategy.Custom;

		if (isCustomStrategy) {
			this.displayCustomNavigationStrategy(containerEl);
		} else {
			containerEl.createDiv({
				cls: "vt-navigation-description",
				text: TabNavigationStrategyDescriptions[
					this.plugin.settings.navigationStrategy
				],
			});
		}
	}

	private displayCustomNavigationStrategy(containerEl: HTMLElement) {
		this.createDropdown(containerEl, {
			name: "Copy from existing strategy",
			options: TabNavigationCopyOptions,
			value: "--copy--",
			onChange: (value) => this.copyNavigationStrategy(value),
			onReset: () => this.resetCustomNavigationStrategy(),
		});

		this.displayAlwaysOpenInNewTabToggle(containerEl);
		if (!this.plugin.settings.alwaysOpenInNewTab) {
			this.displaySmartNavigationToggle(containerEl);
			this.displayEphemeralTabsToggle(containerEl);
			if (this.plugin.settings.ephemeralTabs) {
				this.displayEphemeralTabsOptions(containerEl);
			}
		}

		this.displayDeduplicationToggle(containerEl);
		if (this.plugin.settings.deduplicateTabs) {
			this.displayDeduplicationOptions(containerEl);
		}
	}

	private displayAlwaysOpenInNewTabToggle(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Always open in new tab",
			value: this.plugin.settings.alwaysOpenInNewTab,
			onChange: (value) => {
				useSettings
					.getState()
					.setSettings({ alwaysOpenInNewTab: value });
				this.refresh();
			},
		});
	}

	private displaySmartNavigationToggle(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Smart navigation",
			desc: "Ensures consistent and intuitive behavior when working with multiple tab groups.",
			value: this.plugin.settings.smartNavigation,
			onChange: (value) =>
				useSettings.getState().setSettings({ smartNavigation: value }),
		});
	}

	private displayEphemeralTabsToggle(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Enable ephemeral tabs",
			desc: "Bring VSCode-like ephemeral tabs to Obsidian.",
			value: this.plugin.settings.ephemeralTabs,
			onChange: (value) => this.toggleEphemeralTabs(value),
		});
	}

	private displayEphemeralTabsOptions(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Auto close ephemeral tabs",
			desc: "Close inactive ephemeral tabs automatically and merge their history.",
			value: this.plugin.settings.autoCloseEphemeralTabs,
			onChange: (value) =>
				this.updateEphemeralTabsOptions({
					autoCloseEphemeralTabs: value,
				}),
		});
	}

	private displayDeduplicationToggle(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Deduplicate tabs",
			desc: "Prevent opening the same note in multiple tabs.",
			value: this.plugin.settings.deduplicateTabs,
			onChange: (value) => this.toggleTabDeduplication(value),
		});
	}

	private displayDeduplicationOptions(containerEl: HTMLElement) {
		this.createToggle(containerEl, {
			name: "Deduplicate only same-group tabs",
			desc: "Perform deduplication only within the same tab group.",
			value: this.plugin.settings.deduplicateSameGroupTabs,
			onChange: (value) =>
				this.updateDeduplicationOptions({
					deduplicateSameGroupTabs: value,
				}),
		});

		this.createToggle(containerEl, {
			name: "Deduplicate sidebar tabs",
			desc: "Prevent duplicated tabs in the sidebars.",
			value: this.plugin.settings.deduplicateSidebarTabs,
			onChange: (value) =>
				this.updateDeduplicationOptions({
					deduplicateSidebarTabs: value,
				}),
		});

		this.createToggle(containerEl, {
			name: "Deduplicate popup tabs",
			desc: "Prevent duplicated tabs in popup windows.",
			value: this.plugin.settings.deduplicatePopupTabs,
			onChange: (value) =>
				this.updateDeduplicationOptions({
					deduplicatePopupTabs: value,
				}),
		});
	}

	private updateNavigationStrategy(name: string) {
		useSettings.getState().setTabNavigationStrategy(this.app, name);
		this.refresh();
	}

	private copyNavigationStrategy(name: string) {
		if (name === "--copy--") return;
		const preset = name as TabNavigationStrategy;
		useSettings
			.getState()
			.setTabNavigationStrategy(
				this.app,
				TabNavigationStrategy.Custom,
				TabNavigationPresets[preset]
			);
		this.refresh();
	}

	private resetCustomNavigationStrategy() {
		useSettings
			.getState()
			.setTabNavigationStrategy(this.app, TabNavigationStrategy.Custom);
		this.refresh();
	}

	private toggleEphemeralTabs(isEnabled: boolean) {
		useSettings.getState().setSettings({
			ephemeralTabs: isEnabled,
			autoCloseEphemeralTabs: true,
		});
		if (isEnabled) {
			this.app.workspace.trigger(EVENTS.EPHEMERAL_TABS_INIT, true);
		} else {
			this.app.workspace.trigger(EVENTS.EPHEMERAL_TABS_DEINIT);
		}
		this.refresh();
	}

	private updateEphemeralTabsOptions(
		settings: Partial<TabNavigationStrategySettings>
	) {
		const value = settings.autoCloseEphemeralTabs;
		useSettings.getState().setSettings(settings);
		this.app.workspace.trigger(EVENTS.EPHEMERAL_TABS_UPDATE, true, value);
	}

	private toggleTabDeduplication(isEnabled: boolean) {
		useSettings.getState().setSettings({
			deduplicateTabs: isEnabled,
			deduplicateSameGroupTabs: false,
			deduplicateSidebarTabs: false,
			deduplicatePopupTabs: false,
		});
		if (isEnabled) this.app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
		this.refresh();
	}

	private updateDeduplicationOptions(
		settings: Partial<TabNavigationStrategySettings>
	) {
		useSettings.getState().setSettings(settings);
		this.app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
	}

	// Linked Folder

	private displayLinkedFolderSection(parentEl: HTMLElement) {
		new Setting(parentEl).setName("Linked folder").setHeading();

		this.createDropdown(parentEl, {
			name: "Load order",
			desc: "Determines the order in which files are loaded, such as by name or date.",
			options: linkedFolderSortStrategyOptions,
			value: this.plugin.settings.linkedFolderSortStrategy,
			onChange: (value) =>
				useSettings.getState().setSettings({
					linkedFolderSortStrategy: value,
				}),
		});

		this.createSlider(parentEl, {
			name: "Files per load",
			desc: "Files loaded per click when opening a folder as a group.",
			value: {
				currentValue: this.plugin.settings.linkedFolderLimit,
				defaultValue: 5,
				limits: { min: 5, max: 50, step: 1 },
			},
			onChange: (value) =>
				useSettings.getState().setSettings({
					linkedFolderLimit: value,
				}),
		});
	}

	// Group View

	private displayGroupViewSection(parentEl: HTMLElement) {
		new Setting(parentEl).setName("Group view").setHeading();
		this.displayOptionsForContinuousView(parentEl);
		this.displayOptionsForColumnView(parentEl);
		this.displayOptionsForMissionControlView(parentEl);
	}

	private displayOptionsForContinuousView(parentEl: HTMLElement) {
		this.createToggle(parentEl, {
			name: "Show metadata in continuous view",
			value: this.plugin.settings.continuousViewShowMetadata,
			onChange: (value) =>
				useSettings.getState().setGroupViewOptions(this.app, {
					continuousViewShowMetadata: value,
				}),
		});

		this.createToggle(parentEl, {
			name: "Show backlinks in continuous view",
			value: this.plugin.settings.continuousViewShowBacklinks,
			onChange: (value) =>
				useSettings.getState().setGroupViewOptions(this.app, {
					continuousViewShowBacklinks: value,
				}),
		});
	}

	private displayOptionsForColumnView(parentEl: HTMLElement) {
		this.createSlider(parentEl, {
			name: "Column view tab width",
			desc: "Minimum width of each tab in the column view in pixels.",
			value: {
				currentValue: this.plugin.settings.columnViewMinWidth,
				defaultValue: 300,
				limits: { min: 200, max: 1000, step: 10 },
			},
			onChange: (value) =>
				useSettings.getState().setGroupViewOptions(this.app, {
					columnViewMinWidth: value,
				}),
		});
	}

	private displayOptionsForMissionControlView(parentEl: HTMLElement) {
		this.createSlider(parentEl, {
			name: "Zoom factor in mission control view",
			desc: "Adjust the page size in mission control view.",
			value: {
				currentValue: this.plugin.settings.missionControlViewZoomFactor,
				defaultValue: 0.5,
				limits: { min: 0.5, max: 1, step: 0.1 },
			},
			onChange: (value) =>
				useSettings.getState().setGroupViewOptions(this.app, {
					missionControlViewZoomFactor: value,
				}),
		});

		this.createToggle(parentEl, {
			name: "Disable pointer in mission control view",
			desc: "Prevents interaction with tab content when in mission control view, allowing easier navigation between tabs.",
			value: this.plugin.settings.disablePointerInMissionControlView,
			onChange: (value) =>
				useSettings.getState().setSettings({
					disablePointerInMissionControlView: value,
				}),
		});
	}

	// Miscellaneous

	private displayMiscellaneousSection(parentEl: HTMLElement) {
		new Setting(parentEl).setName("Miscellaneous").setHeading();

		const store = this.plugin.persistenceManager.device;
		const disableOnThisDevice = store.get<boolean>(DISABLE_KEY);
		this.createToggle(parentEl, {
			name: "Disable on this device",
			desc: `Disable Vertical Tabs on this device only.
						 The plugin will remain enabled on other devices.
						 This setting is stored locally and will not sync across devices.`,
			value: disableOnThisDevice ?? false,
			onChange: (value) => this.toggleDisableOnThisDevice(value),
		});

		this.createToggle(parentEl, {
			name: "Background mode",
			desc: `Enable to keep features like tab navigation without showing vertical tabs.
					   This will disable Zen Mode and reset your workspace to the default layout.`,
			value: this.plugin.settings.backgroundMode,
			onChange: (value) => this.toggleBackgroundMode(value),
		});
	}

	private async toggleDisableOnThisDevice(isDisabled: boolean) {
		useSettings.getState().toggleDisableOnThisDevice(isDisabled);
		this.reloadSelf();
		// If the plugin is disabled, automatically close the main view
		if (isDisabled) {
			this.app.workspace
				.getLeavesOfType(VERTICAL_TABS_VIEW)
				.forEach((leaf) => leaf.detach());
		}
	}

	private async toggleBackgroundMode(isBackgroundMode: boolean) {
		useSettings.getState().toggleBackgroundMode(this.app, isBackgroundMode);
		this.reloadSelf();
	}

	// Feedback and Bug Report

	private displaySupportSection(parentEl: HTMLElement) {
		const containerEl = parentEl.createDiv({ cls: "vt-support" });
		this.displayFeedbackContent(containerEl);
		this.displayBugReport(containerEl);
		this.displayDebugTools(containerEl);
	}

	private displayFeedbackContent(parentEl: HTMLElement) {
		parentEl.createDiv({ cls: "title", text: "Enjoying Vertical Tabs?" });
		parentEl.createDiv({ cls: "buttons" }).innerHTML = `
			<a id="vt-support-btn-kofi" href="https://ko-fi.com/oxdcq" target="_blank">
				<img
					width="24"
					border="0"
					style="border: 0px; width: 24px; mix-blend-mode: multiply;"
					src="https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png"
				/>
				<span>Buy me a coffee</span>
			</a>
			<a id="vt-support-btn-github" href="https://github.com/oxdc/obsidian-vertical-tabs" target="_blank">
				<img
					width="24"
					border="0"
					style="border: 0px; width: 24px; mix-blend-mode: multiply;"
					src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
				/>
				<span>Star on GitHub</span>
			</a>
		`;
	}

	private displayBugReport(parentEl: HTMLElement) {
		const containerEl = parentEl.createDiv({ cls: "bug-report" });
		containerEl.appendText("Facing issues or have suggestions? ");
		containerEl.createEl("a", {
			text: "Check out the documentation",
			attr: {
				href: "https://oxdc.github.io/obsidian-vertical-tabs-docs/",
				target: "_blank",
			},
		});
		containerEl.appendText(" or ");
		containerEl.createEl("a", {
			text: "submit a report",
			attr: {
				href: "https://github.com/oxdc/obsidian-vertical-tabs/issues/new/choose",
				target: "_blank",
			},
		});
		containerEl.appendText(".");
	}

	// Debugging Tools

	private displayDebugTools(parentEl: HTMLElement) {
		const containerEl = parentEl.createDiv({
			cls: "debugging-helper",
		});

		this.createDebugButton(
			containerEl,
			{ icon: "copy", text: "Copy plugin settings" },
			() => this.copyPluginSettingsToClipboard()
		);

		this.createDebugButton(
			containerEl,
			{ icon: "bug", text: "Show debug info" },
			() => this.app.commands.executeCommandById("app:show-debug-info")
		);

		if (Platform.isDesktopApp) {
			this.createDebugButton(
				containerEl,
				{ icon: "square-terminal", text: "Open dev console" },
				() => this.openDevConsole()
			);
		}

		this.createDebugButton(
			containerEl,
			{ icon: "flask-conical", text: "Open sandbox vault" },
			() => this.app.commands.executeCommandById("app:open-sandbox-vault")
		);

		this.createDebugButton(
			containerEl,
			{ icon: "rotate-ccw", text: "Reload Vertical Tabs" },
			() => this.reloadSelf()
		);

		this.createConfirmationButton(
			containerEl,
			{
				icon: "app-window-mac",
				text: "Reload Obsidian without saving",
				destructive: true,
				countdownSeconds: 5,
			},
			() => this.app.commands.executeCommandById("app:reload")
		);
	}

	private createDebugButton(
		parentEl: HTMLElement,
		props: { icon: string; text: string },
		onClick?: () => void
	) {
		const buttonEl = parentEl.createEl("button");
		const iconEl = buttonEl.createEl("span");
		const textEl = buttonEl.createEl("span");
		setIcon(iconEl, props.icon);
		textEl.setText(props.text);
		if (onClick) buttonEl.onclick = onClick;
		return { buttonEl, iconEl, textEl };
	}

	private createConfirmationButton(
		parentEl: HTMLElement,
		props: {
			icon: string;
			text: string;
			destructive?: boolean;
			countdownSeconds?: number;
			delaySeconds?: number;
			confirmationTextFormat?: (countdown: number) => string;
		},
		onClick: () => void
	) {
		let clickedOnce = false;
		let firstClickTime = 0;
		let countdownInterval: NodeJS.Timeout;
		const countdownSeconds = props.countdownSeconds ?? 5;
		const delaySeconds = props.delaySeconds ?? 1;

		const confirmationTextFormat = (countdown: number) => {
			return props.confirmationTextFormat
				? props.confirmationTextFormat(countdown)
				: `Click again to confirm (in ${countdown}s)`;
		};

		const updateButtonText = (text: string, icon = "timer") => {
			setIcon(iconEl, icon);
			textEl.setText(text);
		};

		const button = this.createDebugButton(parentEl, props);
		const { buttonEl, iconEl, textEl } = button;
		if (props.destructive) buttonEl.classList.add("mod-destructive");

		buttonEl.onclick = () => {
			const currentTime = Date.now();
			if (!clickedOnce) {
				// First click
				clickedOnce = true;
				firstClickTime = currentTime;
				let countdown = countdownSeconds;
				updateButtonText(confirmationTextFormat(countdown));
				// Countdown timer that updates every second
				countdownInterval = setInterval(() => {
					countdown--;
					if (countdown > 0) {
						updateButtonText(confirmationTextFormat(countdown));
					} else {
						// Reset when countdown reaches 0
						clearInterval(countdownInterval);
						clickedOnce = false;
						firstClickTime = 0;
						updateButtonText(props.text, props.icon);
					}
				}, 1000);
			} else {
				// Second click - check if at least 1 second has passed
				const timeSinceFirstClick = currentTime - firstClickTime;
				if (timeSinceFirstClick >= delaySeconds * 1000) {
					// Execute the command only if at least 1 second has passed
					clearInterval(countdownInterval);
					onClick();
				}
				// If less than 1 second has passed, ignore the click
			}
		};

		return { buttonEl, iconEl, textEl };
	}

	private async copyPluginSettingsToClipboard() {
		const settings = this.plugin.settings;
		const version = this.plugin.manifest.version;
		const pluginInfo = { version, settings };
		const json = JSON.stringify(pluginInfo, null, 2);
		const markdown = "```json\n" + json + "\n```";
		pluginInfo.settings.installationID = "[Redacted]";
		await navigator.clipboard.writeText(markdown);
		new Notice("Plugin settings copied to clipboard");
	}

	private openDevConsole() {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(window as any)
				.require("electron")
				.remote.getCurrentWebContents()
				.openDevTools();
		} catch (error) {
			console.error(error);
		}
	}

	private async reloadSelf() {
		try {
			const id = this.plugin.manifest.id;
			const scorllTop = this.containerEl.scrollTop;
			await this.app.plugins.disablePlugin(id);
			await this.app.plugins.enablePlugin(id);
			const newSettingTab = this.app.setting.openTabById(id);
			newSettingTab.containerEl.scrollTop = scorllTop;
			new Notice("Vertical Tabs reloaded");
		} catch (error) {
			console.error(error);
		}
	}
}
