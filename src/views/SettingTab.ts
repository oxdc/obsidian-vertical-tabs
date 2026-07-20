import {
	App,
	DropdownComponent,
	Notice,
	Platform,
	PluginSettingTab,
	requireApiVersion,
	setIcon,
	Setting,
	SettingDefinitionItem,
	SettingGroup,
	SliderComponent,
} from "obsidian";
import ObsidianVerticalTabs from "../main";
import {
	loadDisableOnThisDevice,
	useSettings,
} from "../models/PluginContext";
import {
	NewTabButtonPlacement,
	NewTabButtonPlacementOptions,
} from "../models/NewTab";
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
import {
	TabClosingBehavior,
	TabClosingBehaviorOptions,
} from "src/services/CloseTabs";

interface ToggleProps {
	name: string;
	desc?: string;
	value: boolean;
	onChange: (value: boolean) => void;
}

interface SliderSpec {
	value: {
		currentValue: number;
		defaultValue: number;
		limits: { min: number; max: number; step: number };
	};
	onChange: (value: number) => void;
	onReset?: () => void;
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

interface DropdownSpec {
	options: Record<string, string>;
	value: {
		currentValue: string;
		defaultValue: string;
	};
	disabled?: boolean;
	onChange: (value: string) => void;
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
	currentNavigationPreset: string | null = null;
	debugToolsVisible = false;

	constructor(app: App, plugin: ObsidianVerticalTabs) {
		super(app, plugin);
		this.plugin = plugin;
		if (requireApiVersion("1.11.0")) {
			this.icon = "vertical-tabs";
		}
	}

	private refresh() {
		if (requireApiVersion("1.13.0")) {
			this.update();
		} else {
			const scrollTop = this.containerEl.scrollTop;
			this.display();
			this.containerEl.scrollTop = scrollTop;
		}
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		const disableOnThisDevice = loadDisableOnThisDevice();

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

	private createSettingGroup(parentEl: HTMLElement, name?: string) {
		if (requireApiVersion("1.11.0")) {
			const group = new SettingGroup(parentEl);
			if (name) group.setHeading(name);
			return group;
		} else {
			if (name) new Setting(parentEl).setName(name).setHeading();
			return parentEl;
		}
	}

	// prettier-ignore
	private createSetting(parentEl: HTMLElement | SettingGroup, callback?: (setting: Setting) => void) {
		if (requireApiVersion("1.11.0") && parentEl instanceof SettingGroup) {
			let setting: Setting | undefined;
			parentEl.addSetting((s) => { setting = s; if(callback) callback(s); });
			if (!setting) throw new Error("Failed to create setting");
			return setting;
		} else if (parentEl instanceof HTMLElement) {
			const setting = new Setting(parentEl);
			if(callback) callback(setting);
			return setting;
		} else {
			throw new Error("Invalid parent element or unsupported API version");
		}
	}

	private createToggle(
		parentEl: HTMLElement | SettingGroup,
		props: ToggleProps
	) {
		const { name, desc, value, onChange } = props;
		const toggleEl = this.createSetting(parentEl, (setting) => {
			setting.setName(name).addToggle((toggle) => {
				toggle.setValue(value).onChange(onChange);
			});
		});
		if (desc) toggleEl.setDesc(desc);
		return toggleEl;
	}

	private setSlider(setting: Setting, spec: SliderSpec) {
		const { value, onChange, onReset } = spec;
		const { currentValue, defaultValue, limits } = value;
		const { min, max, step } = limits;
		let sliderEl: SliderComponent | null = null;
		const resetHandler = onReset ?? (() => onChange(defaultValue));
		const resetHandlerWrapper = () => {
			resetHandler();
			sliderEl?.setValue(defaultValue);
		};
		setting.addExtraButton((button) => {
			button
				.setIcon("reset")
				.setTooltip("Reset to default")
				.onClick(resetHandlerWrapper);
		});
		setting.addSlider((slider) => {
			sliderEl = slider;
			slider
				.setLimits(min, max, step)
				.setValue(currentValue)
				.setDynamicTooltip()
				.onChange(onChange);
		});
	}

	private createSlider(
		parentEl: HTMLElement | SettingGroup,
		props: SliderProps
	) {
		const { name, desc, value, onChange, onReset } = props;
		const { currentValue, defaultValue, limits } = value;
		const resetHandler = onReset ?? (() => onChange(defaultValue));
		const sliderEl = this.createSetting(parentEl, (setting) => {
			setting
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
		});
		if (desc) sliderEl.setDesc(desc);
		return sliderEl;
	}

	private setDropdown(setting: Setting, spec: DropdownSpec) {
		const { options, value, disabled, onChange, onReset } = spec;
		const { currentValue, defaultValue } = value;
		let dropdownEl: DropdownComponent | null = null;
		const resetHandler = onReset ?? (() => onChange(defaultValue));
		const resetHandlerWrapper = () => {
			resetHandler();
			dropdownEl?.setValue(defaultValue);
		};
		setting.addExtraButton((button) => {
			button
				.setIcon("reset")
				.setTooltip("Reset to default")
				.setDisabled(!!disabled)
				.onClick(resetHandlerWrapper);
		});
		setting.addDropdown((dropdown) => {
			dropdownEl = dropdown;
			dropdown
				.addOptions(options)
				.setValue(currentValue)
				.setDisabled(!!disabled)
				.onChange(onChange);
		});
		return dropdownEl;
	}

	private createDropdown(
		parentEl: HTMLElement | SettingGroup,
		props: DropdownProps
	) {
		const { name, desc, options, value, onChange, onReset } = props;
		const dropdownEl = this.createSetting(parentEl, (setting) => {
			setting
				.setName(name)
				.addDropdown((dropdown) =>
					dropdown
						.addOptions(options)
						.setValue(value)
						.onChange(onChange)
				);
		});
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
		const group = this.createSettingGroup(containerEl);
		const entry = this.createSetting(group, (setting) => {
			setting.setName("Updates");
		});
		void this.__displayUpdateIndicator(entry);
	}

	private async __displayUpdateIndicator(entry: Setting) {
		if (this.isBetaVersion(this.plugin.manifest.version)) {
			const betaVersionInfo = entry.descEl.createSpan({
				cls: "vt-beta-version-info",
			});
			betaVersionInfo.appendText(
				`You are running beta version ${this.plugin.manifest.version}. Beta updates are managed by the `
			);
			betaVersionInfo.createEl("a", {
				text: "Beta Helper",
				href: "https://github.com/oxdc/obsidian-vertical-tabs-beta-helper",
				attr: { target: "_blank" },
			});
			betaVersionInfo.appendText(
				` plugin. For more information, please refer to the `
			);
			betaVersionInfo.createEl("a", {
				text: "Beta Program documentation",
				href: "https://vertical-tabs-docs.oxdc.dev/Beta-Versions/beta-program",
				attr: { target: "_blank" },
			});
		} else {
			if (this.plugin.settings.enableUpdateCheck ?? true) {
				const indicator = entry.controlEl.createDiv();
				this.showLoadingState(entry, indicator);
				void this.checkForUpdates(entry, indicator);
			} else {
				entry.setDesc(
					`Update checking is disabled. Current version: ${this.plugin.manifest.version}`
				);
			}
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
		if (!(this.plugin.settings.enableUpdateCheck ?? true)) return;
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
		} catch {
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
		entry.descEl.createSpan().createEl("a", {
			text: "Release notes",
			href: `https://github.com/oxdc/obsidian-vertical-tabs/releases/tag/${latestVersion}`,
			attr: { target: "_blank", rel: "noopener noreferrer" },
		});
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
			onClick: () => void this.toggleBackgroundMode(false),
		});
	}

	private displayPluginDisabledWarningBanner(containerEl: HTMLElement) {
		this.createWarningBanner(containerEl, {
			template: `Vertical Tabs is disabled on this device. To access plugin features and settings,
							   you must first {enable} it.`,
			onClick: () => void this.toggleDisableOnThisDevice(false),
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
		warning.appendText(suffix ?? "");
		linkButton.onclick = () => {
			onClick();
			this.refresh();
		};
	}

	// Basic Settings

	private displayBasicSettingsSection(containerEl: HTMLElement) {
		const group = this.createSettingGroup(containerEl);
		this.displayCommonSettingsSection(group);
		if (Platform.isMobile) {
			this.displayMobileSettingsSection(group);
		}
	}

	private displayCommonSettingsSection(
		containerEl: HTMLElement | SettingGroup
	) {
		this.displayVisualOptions(containerEl);
		this.displayTabZoomOptions(containerEl);
	}

	private displayVisualOptions(containerEl: HTMLElement | SettingGroup) {
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

		this.createDropdown(containerEl, {
			name: "Tab closing behavior",
			desc: "Choose which tab becomes active after closing the current tab.",
			options: TabClosingBehaviorOptions,
			value: this.plugin.settings.tabClosingBehavior,
			onChange: (value) =>
				useSettings.getState().setSettings({
					tabClosingBehavior: value as TabClosingBehavior,
				}),
		});

		this.createDropdown(containerEl, {
			name: "New tab button placement",
			desc: "Choose where to show the new tab button.",
			options: NewTabButtonPlacementOptions,
			value: this.plugin.settings.newTabButtonPlacement,
			onChange: (value) => {
				useSettings.getState().setSettings({
					newTabButtonPlacement: value as NewTabButtonPlacement,
				});
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

	private displayTabZoomOptions(containerEl: HTMLElement | SettingGroup) {
		this.createToggle(containerEl, {
			name: "Enable tab zoom",
			desc: "Enable per tab zooming.",
			value: this.plugin.settings.enableTabZoom,
			onChange: (value) =>
				useSettings.getState().setSettings({ enableTabZoom: value }),
		});
	}

	private displayMobileSettingsSection(
		containerEl: HTMLElement | SettingGroup
	) {
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
		const group = this.createSettingGroup(
			containerEl,
			"Horizontal tab control"
		);

		this.displayHorizontalTabsOptions(group);
		this.displayEnhancedKeyboardTabSwitchToggle(group);

		if (!this.plugin.settings.showActiveTabs) {
			this.displayScrollableTabsToggle(group);
			if (this.plugin.settings.scrollableTabs) {
				this.displayScrollableTabsOptions(group);
			}
		}
	}

	private displayHorizontalTabsOptions(
		containerEl: HTMLElement | SettingGroup
	) {
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
			desc: "Automatically hide horizontal tabs when the vertical tabs pane is visible and active in the sidebar.",
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

	private displayEnhancedKeyboardTabSwitchToggle(
		containerEl: HTMLElement | SettingGroup
	) {
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

	private displayScrollableTabsToggle(
		containerEl: HTMLElement | SettingGroup
	) {
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

	private displayScrollableTabsOptions(
		containerEl: HTMLElement | SettingGroup
	) {
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
		const group = this.createSettingGroup(containerEl, "Tab navigation");

		this.createDropdown(group, {
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
			this.displayCustomNavigationStrategy(group);
		} else {
			let descEl: HTMLElement = containerEl;
			if (requireApiVersion("1.11.0")) {
				const descriptionSetting = this.createSetting(group);
				descEl = descriptionSetting.settingEl;
				descEl.empty();
			}

			descEl.createDiv({
				cls: "vt-navigation-description",
				text: TabNavigationStrategyDescriptions[
					this.plugin.settings.navigationStrategy
				],
			});
		}
	}

	private displayCustomNavigationStrategy(
		containerEl: HTMLElement | SettingGroup
	) {
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

	private displayAlwaysOpenInNewTabToggle(
		containerEl: HTMLElement | SettingGroup
	) {
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

	private displaySmartNavigationToggle(
		containerEl: HTMLElement | SettingGroup
	) {
		this.createToggle(containerEl, {
			name: "Smart navigation",
			desc: "Ensures consistent and intuitive behavior when working with multiple tab groups.",
			value: this.plugin.settings.smartNavigation,
			onChange: (value) =>
				useSettings.getState().setSettings({ smartNavigation: value }),
		});
	}

	private displayEphemeralTabsToggle(
		containerEl: HTMLElement | SettingGroup
	) {
		this.createToggle(containerEl, {
			name: "Enable ephemeral tabs",
			desc: "Bring VSCode-like ephemeral tabs to Obsidian.",
			value: this.plugin.settings.ephemeralTabs,
			onChange: (value) => this.toggleEphemeralTabs(value),
		});
	}

	private displayEphemeralTabsOptions(
		containerEl: HTMLElement | SettingGroup
	) {
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

	private displayDeduplicationToggle(
		containerEl: HTMLElement | SettingGroup
	) {
		this.createToggle(containerEl, {
			name: "Deduplicate tabs",
			desc: "Prevent opening the same note in multiple tabs.",
			value: this.plugin.settings.deduplicateTabs,
			onChange: (value) => this.toggleTabDeduplication(value),
		});
	}

	private displayDeduplicationOptions(
		containerEl: HTMLElement | SettingGroup
	) {
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
		const group = this.createSettingGroup(parentEl, "Linked folder");

		this.createDropdown(group, {
			name: "Load order",
			desc: "Determines the order in which files are loaded, such as by name or date.",
			options: linkedFolderSortStrategyOptions,
			value: this.plugin.settings.linkedFolderSortStrategy,
			onChange: (value) =>
				useSettings.getState().setSettings({
					linkedFolderSortStrategy: value,
				}),
		});

		this.createSlider(group, {
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
		const group = this.createSettingGroup(parentEl, "Group view");
		this.displayOptionsForContinuousView(group);
		this.displayOptionsForColumnView(group);
		this.displayOptionsForMissionControlView(group);
	}

	private displayOptionsForContinuousView(
		parentEl: HTMLElement | SettingGroup
	) {
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

	private displayOptionsForColumnView(parentEl: HTMLElement | SettingGroup) {
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

	private displayOptionsForMissionControlView(
		parentEl: HTMLElement | SettingGroup
	) {
		this.createToggle(parentEl, {
			name: "Show mission control toggle button",
			desc: "Show a button in the tab bar to activate the mission control view.",
			value: this.plugin.settings.showMissionControlToggle,
			onChange: (value) =>
				useSettings.getState().setSettings({
					showMissionControlToggle: value,
				}),
		});

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
		const group = this.createSettingGroup(parentEl, "Miscellaneous");

		const disableOnThisDevice = loadDisableOnThisDevice();
		this.createToggle(group, {
			name: "Disable on this device",
			desc: `Disable Vertical Tabs on this device only.
						 The plugin will remain enabled on other devices.
						 This setting is stored locally and will not sync across devices.`,
			value: disableOnThisDevice,
			onChange: (value) => void this.toggleDisableOnThisDevice(value),
		});

		this.createToggle(group, {
			name: "Background mode",
			desc: `Enable to keep features like tab navigation without showing vertical tabs.
					   This will disable Zen Mode and reset your workspace to the default layout.`,
			value: this.plugin.settings.backgroundMode,
			onChange: (value) => void this.toggleBackgroundMode(value),
		});

		this.createToggle(group, {
			name: "Check for updates",
			desc: "Automatically check for plugin updates when opening settings.",
			value: this.plugin.settings.enableUpdateCheck ?? true,
			onChange: (value) => {
				useSettings
					.getState()
					.setSettings({ enableUpdateCheck: value });
				this.refresh();
			},
		});
	}

	private async __displayUpdateCheckToggle(setting: Setting) {
		setting.addToggle((toggle) =>
			toggle
				.setValue(this.plugin.settings.enableUpdateCheck ?? true)
				.onChange((value) => {
					useSettings
						.getState()
						.setSettings({ enableUpdateCheck: value });
					this.refresh();
				})
		);
	}

	private async toggleDisableOnThisDevice(isDisabled: boolean) {
		useSettings.getState().toggleDisableOnThisDevice(isDisabled);
		// If the plugin is disabled, automatically close the main view
		if (isDisabled) {
			this.app.workspace
				.getLeavesOfType(VERTICAL_TABS_VIEW)
				.forEach((leaf) => leaf.detach());
		}
		new Notice(
			"Vertical Tabs has been disabled on this device. Please reopen Obsidian for the changes to take effect."
		);
	}

	private async toggleBackgroundMode(isBackgroundMode: boolean) {
		useSettings.getState().toggleBackgroundMode(this.app, isBackgroundMode);
		new Notice(
			"Background mode has been enabled. Please reopen Obsidian for the changes to take effect."
		);
	}

	// Feedback and Bug Report

	private displaySupportSection(parentEl: HTMLElement) {
		if (parentEl.querySelector(".vt-support")) return;
		const containerEl = parentEl.createDiv({ cls: "vt-support" });
		this.displayFeedbackContent(containerEl);
		this.displayBugReport(containerEl);
		this.displayDebugTools(containerEl);
	}

	private displayFeedbackContent(parentEl: HTMLElement) {
		parentEl.createDiv({ cls: "title", text: "Enjoying Vertical Tabs?" });
		const buttons = parentEl.createDiv({ cls: "buttons" });
		const kofiButton = buttons.createEl("a", {
			href: "https://ko-fi.com/oxdcq",
			attr: { id: "vt-support-btn-kofi", target: "_blank" },
		});
		kofiButton.createEl("img", {
			attr: {
				src: "https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png",
				width: "24",
				border: "0",
				style: "border: 0px; width: 24px; mix-blend-mode: multiply;",
			},
		});
		kofiButton.createSpan({ text: "Buy me a coffee" });
		const githubButton = buttons.createEl("a", {
			href: "https://github.com/oxdc/obsidian-vertical-tabs",
			attr: { id: "vt-support-btn-github", target: "_blank" },
		});
		githubButton.createEl("img", {
			attr: {
				src: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
				width: "24",
				border: "0",
				style: "border: 0px; width: 24px; mix-blend-mode: multiply;",
			},
		});
		githubButton.createSpan({ text: "Star on GitHub" });
		parentEl.createDiv({
			cls: "title",
			text: "Be first to what's next?",
		});
		const betaButtons = parentEl.createDiv({ cls: "buttons" });
		const joinButton = betaButtons.createEl("a", {
			href: "https://vertical-tabs-docs.oxdc.dev/Beta-Versions/beta-program",
			attr: { id: "vt-support-btn-beta", target: "_blank" },
		});
		const betaIcon = joinButton.createSpan({ cls: "vt-support-btn-icon" });
		setIcon(betaIcon, "sparkles");
		joinButton.createSpan({ text: "Join the Beta Program" });
		const roadmapButton = betaButtons.createEl("a", {
			href: "https://vertical-tabs-docs.oxdc.dev/roadmap",
			attr: { id: "vt-support-btn-roadmap", target: "_blank" },
		});
		const roadmapIcon = roadmapButton.createSpan({
			cls: "vt-support-btn-icon",
		});
		setIcon(roadmapIcon, "map");
		roadmapButton.createSpan({ text: "View roadmap" });
	}

	private displayBugReport(parentEl: HTMLElement) {
		const containerEl = parentEl.createDiv({ cls: "bug-report" });
		containerEl.appendText("Facing issues or have suggestions? ");
		containerEl.createEl("a", {
			text: "Check out the documentation",
			attr: {
				href: "https://vertical-tabs-docs.oxdc.dev/",
				target: "_blank",
			},
		});
		containerEl.appendText(" or ");
		containerEl.createEl("a", {
			text: "Submit a report",
			attr: {
				href: "https://github.com/oxdc/obsidian-vertical-tabs/issues/new/choose",
				target: "_blank",
			},
		});
		containerEl.appendText(".");
	}

	// Debugging Tools

	private displayDebugTools(parentEl: HTMLElement) {
		const toggleEl = parentEl.createDiv({ cls: "debugging-toggle" });
		const toggleLabelEl = toggleEl.createSpan({
			cls: "debugging-toggle-label",
		});
		const updateToggleLabel = () =>
			toggleLabelEl.setText(
				this.debugToolsVisible
					? "Hide debugging tools"
					: "Show debugging tools"
			);
		updateToggleLabel();

		const containerEl = parentEl.createDiv({
			cls: "debugging-helper",
		});
		if (!this.debugToolsVisible) containerEl.addClass("is-hidden");

		toggleEl.onclick = () => {
			this.debugToolsVisible = !this.debugToolsVisible;
			containerEl.toggleClass("is-hidden", !this.debugToolsVisible);
			updateToggleLabel();
			// scroll to the bottom of the container
			this.containerEl.scrollTop =
				this.containerEl.scrollHeight - this.containerEl.clientHeight;
		};

		this.createDebugButton(
			containerEl,
			{ icon: "copy", text: "Copy plugin settings" },
			() => void this.copyPluginSettingsToClipboard()
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

			this.createDebugButton(
				containerEl,
				{ icon: "flask-conical", text: "Open sandbox vault" },
				() =>
					this.app.commands.executeCommandById(
						"app:open-sandbox-vault"
					)
			);
		}

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
		const iconEl = buttonEl.createSpan();
		const textEl = buttonEl.createSpan();
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
		let countdownInterval: number;
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
				countdownInterval = window.setInterval(() => {
					countdown--;
					if (countdown > 0) {
						updateButtonText(confirmationTextFormat(countdown));
					} else {
						// Reset when countdown reaches 0
						window.clearInterval(countdownInterval);
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
					window.clearInterval(countdownInterval);
					onClick();
				}
				// If less than 1 second has passed, ignore the click
			}
		};

		return { buttonEl, iconEl, textEl };
	}

	private async copyPluginSettingsToClipboard() {
		const settings = { ...this.plugin.settings };
		const version = this.plugin.manifest.version;
		const pluginInfo = { version, settings };
		const json = JSON.stringify(pluginInfo, null, 2);
		const markdown = "```json\n" + json + "\n```";
		await navigator.clipboard.writeText(markdown);
		new Notice("Plugin settings copied to clipboard");
	}

	private openDevConsole() {
		try {
			const electronWindow = window as Window & {
				require?(module: string): unknown;
			};
			if (!electronWindow.require) return;
			const { remote } = electronWindow.require("electron") as {
				remote: { getCurrentWebContents(): { openDevTools(): void } };
			};
			remote.getCurrentWebContents().openDevTools();
		} catch (error) {
			console.error(error);
		}
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		switch (key) {
			case "navigationStrategy":
				this.updateNavigationStrategy(value as TabNavigationStrategy);
				break;
			case "ephemeralTabs":
				this.toggleEphemeralTabs(value as boolean);
				break;
			case "autoCloseEphemeralTabs":
				this.updateEphemeralTabsOptions({
					autoCloseEphemeralTabs: value as boolean,
				});
				break;
			case "deduplicateTabs":
				this.toggleTabDeduplication(value as boolean);
				break;
			case "deduplicateSameGroupTabs":
				this.updateDeduplicationOptions({
					deduplicateSameGroupTabs: value as boolean,
				});
				break;
			case "deduplicateSidebarTabs":
				this.updateDeduplicationOptions({
					deduplicateSidebarTabs: value as boolean,
				});
				break;
			case "deduplicatePopupTabs":
				this.updateDeduplicationOptions({
					deduplicatePopupTabs: value as boolean,
				});
				break;
			case "continuousViewShowMetadata":
			case "continuousViewShowBacklinks":
				useSettings
					.getState()
					.setGroupViewOptions(this.app, { [key]: value as number });
				break;
			default:
				useSettings.getState().setSettings({ [key]: value });
		}
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			// Update indicator
			{
				type: "group",
				items: [
					{
						name: "Updates",
						render: (setting) => {
							void this.__displayUpdateIndicator(setting);
						},
					},
				],
			},

			// Warning banners
			{
				type: "group",
				visible: () =>
					this.plugin.settings.backgroundMode ||
					loadDisableOnThisDevice(),
				items: [
					{
						name: "",
						searchable: false,
						render: (setting, group) => {
							setting.settingEl.addClass("vt-dummy-item");
							group.groupEl.addClass("vt-dummy-group");
							if (this.plugin.settings.backgroundMode) {
								this.displayBackgroundModeWarningBanner(
									group.groupEl
								);
							}
							if (loadDisableOnThisDevice()) {
								this.displayPluginDisabledWarningBanner(
									group.groupEl
								);
							}
						},
					},
				],
			},

			// Basic settings
			{
				type: "group",
				visible: () =>
					!loadDisableOnThisDevice() &&
					!this.plugin.settings.backgroundMode,
				items: [
					{
						name: "Hide sidebar tabs",
						desc: "Don't show sidebar tabs in Vertical Tabs.",
						control: { type: "toggle", key: "hideSidebars" },
					},
					{
						name: "Trim tab names",
						desc: "Use ellipsis to fit tab names on a single line.",
						control: { type: "toggle", key: "trimTabNames" },
					},
					{
						name: "Auto uncollapse active group",
						desc: "Automatically uncollapse the active groups when switching tabs.",
						control: { type: "toggle", key: "autoUncollapseGroup" },
					},
					{
						name: "Tab closing behavior",
						desc: "Choose which tab becomes active after closing the current tab.",
						control: {
							type: "dropdown",
							key: "tabClosingBehavior",
							options: TabClosingBehaviorOptions,
						},
					},
					{
						name: this.plugin.settings.alwaysOpenInNewTab
							? "New note button placement"
							: "New tab/note button placement",
						desc: this.plugin.settings.alwaysOpenInNewTab
							? "Choose where to show the new note button."
							: "Choose where to show the new tab/note button.",
						control: {
							type: "dropdown",
							key: "newTabButtonPlacement",
							options: NewTabButtonPlacementOptions,
						},
					},
					{
						name: "Show more actions",
						desc: "Show more control buttons in the toolbar.",
						control: { type: "toggle", key: "showMoreButtons" },
					},
					{
						name: "Enable tab zoom",
						desc: "Enable per tab zooming.",
						control: { type: "toggle", key: "enableTabZoom" },
					},
					{
						name: "Mobile action preference",
						desc: this.plugin.settings.useTabEditing
							? "Enable tab editing mode to show control buttons on mobile."
							: "Show control buttons such as new-tab buttons and close icons on mobile.",
						visible: () => Platform.isMobile,
						control: {
							type: "dropdown",
							key: "useTabEditing",
							options: {
								"show-all": "Show all buttons",
								"tab-editing": "Enable tab editing mode",
							},
						},
					},
				],
			},

			// Horizontal tab control
			{
				type: "group",
				heading: "Horizontal tab control",
				items: [
					{
						name: "Show active tabs only",
						desc: "Hide inactive horizontal tabs to make workspace cleaner.",
						visible: () => !this.plugin.settings.backgroundMode,
						control: { type: "toggle", key: "showActiveTabs" },
					},
					{
						name: "Auto hide horizontal tabs",
						desc: "Automatically hide horizontal tabs when the vertical tabs pane is visible and active in the sidebar",
						visible: () => !this.plugin.settings.backgroundMode,
						control: {
							type: "toggle",
							key: "autoHideHorizontalTabs",
						},
					},
					{
						name: "Hide inactive tabs in Zen Mode",
						desc: "Hide inactive horizontal tabs when Zen Mode is enabled.",
						visible: () => !this.plugin.settings.backgroundMode,
						control: {
							type: "toggle",
							key: "showActiveTabsInZenMode",
						},
					},
					{
						name: "Enhanced keyboard tab switching",
						desc: "Use Ctrl/Cmd + 1-9 to switch between tabs.",
						visible: () => !this.plugin.settings.backgroundMode,
						control: {
							type: "toggle",
							key: "enhancedKeyboardTabSwitch",
						},
					},
					{
						name: "Scrollable tabs",
						desc: "Enable horizontal scrolling for tab headers when they exceed available width.",
						visible: () => !this.plugin.settings.showActiveTabs,
						control: { type: "toggle", key: "scrollableTabs" },
					},
					{
						name: "Tab minimum width",
						desc: "Minimum width of each tab header in pixels.",
						visible: () =>
							!this.plugin.settings.showActiveTabs &&
							this.plugin.settings.scrollableTabs,
						render: (setting) => {
							this.setSlider(setting, {
								value: {
									currentValue:
										this.plugin.settings
											.scrollableTabsMinWidth,
									defaultValue: 100,
									limits: { min: 50, max: 300, step: 10 },
								},
								onChange: (value: number) =>
									useSettings
										.getState()
										.setScrollableTabsMinWidth(value),
							});
						},
					},
				],
			},

			// Tab navigation
			{
				type: "group",
				heading: "Tab navigation",
				items: [
					{
						name: "Navigation strategy",
						desc: "Controls the navigation behavior when new notes are opened.",
						control: {
							type: "dropdown",
							key: "navigationStrategy",
							options: TabNavigationStrategyOptions,
						},
					},
					{
						name: "Explanation",
						searchable: false,
						visible: () =>
							this.plugin.settings.navigationStrategy !==
							TabNavigationStrategy.Custom,
						render: (setting) => {
							setting.setDesc(
								TabNavigationStrategyDescriptions[
									this.plugin.settings.navigationStrategy
								] as string
							);
							setting.addButton((botton) =>
								botton
									.setButtonText("Customize")
									.onClick(() => {
										this.currentNavigationPreset =
											this.plugin.settings.navigationStrategy;
										this.copyNavigationStrategy(
											this.currentNavigationPreset
										);
									})
							);
						},
					},
					{
						name: "Copy from existing strategy",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
							TabNavigationStrategy.Custom,
						render: (setting) => {
							this.setDropdown(setting, {
								options: TabNavigationCopyOptions,
								value: {
									currentValue:
										this.currentNavigationPreset ??
										"--copy--",
									defaultValue: "--copy--",
								},
								onChange: (value) =>
									this.copyNavigationStrategy(value),
								onReset: () =>
									this.resetCustomNavigationStrategy(),
							});
							this.currentNavigationPreset = null;
						},
					},
					{
						name: "Always open in new tab",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
							TabNavigationStrategy.Custom,
						control: { type: "toggle", key: "alwaysOpenInNewTab" },
					},
					{
						name: "Smart navigation",
						desc: "Ensures consistent and intuitive behavior when working with multiple tab groups.",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
								TabNavigationStrategy.Custom &&
							!this.plugin.settings.alwaysOpenInNewTab,
						control: { type: "toggle", key: "smartNavigation" },
					},
					{
						name: "Enable ephemeral tabs",
						desc: "Bring VSCode-like ephemeral tabs to Obsidian.",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
								TabNavigationStrategy.Custom &&
							!this.plugin.settings.alwaysOpenInNewTab,
						control: { type: "toggle", key: "ephemeralTabs" },
					},
					{
						name: "Auto close ephemeral tabs",
						desc: "Close inactive ephemeral tabs automatically and merge their history.",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
								TabNavigationStrategy.Custom &&
							!this.plugin.settings.alwaysOpenInNewTab &&
							this.plugin.settings.ephemeralTabs,
						control: {
							type: "toggle",
							key: "autoCloseEphemeralTabs",
						},
					},
					{
						name: "Deduplicate tabs",
						desc: "Prevent opening the same note in multiple tabs.",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
							TabNavigationStrategy.Custom,
						control: { type: "toggle", key: "deduplicateTabs" },
					},
					{
						name: "Deduplicate only same-group tabs",
						desc: "Perform deduplication only within the same tab group.",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
								TabNavigationStrategy.Custom &&
							this.plugin.settings.deduplicateTabs,
						control: {
							type: "toggle",
							key: "deduplicateSameGroupTabs",
						},
					},
					{
						name: "Deduplicate sidebar tabs",
						desc: "Prevent duplicated tabs in the sidebars.",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
								TabNavigationStrategy.Custom &&
							this.plugin.settings.deduplicateTabs,
						control: {
							type: "toggle",
							key: "deduplicateSidebarTabs",
						},
					},
					{
						name: "Deduplicate popup tabs",
						desc: "Prevent duplicated tabs in popup windows.",
						visible: () =>
							this.plugin.settings.navigationStrategy ===
								TabNavigationStrategy.Custom &&
							this.plugin.settings.deduplicateTabs,
						control: {
							type: "toggle",
							key: "deduplicatePopupTabs",
						},
					},
				],
			},

			// Linked folder
			{
				type: "group",
				heading: "Linked folder",
				visible: () =>
					!this.plugin.settings.backgroundMode &&
					!loadDisableOnThisDevice(),
				items: [
					{
						name: "Load order",
						desc: "Determines the order in which files are loaded, such as by name or date.",
						control: {
							type: "dropdown",
							key: "linkedFolderSortStrategy",
							options: linkedFolderSortStrategyOptions,
						},
					},
					{
						name: "Files per load",
						desc: "Files loaded per click when opening a folder as a group.",
						render: (setting) => {
							this.setSlider(setting, {
								value: {
									currentValue:
										this.plugin.settings.linkedFolderLimit,
									defaultValue: 5,
									limits: { min: 5, max: 50, step: 1 },
								},
								onChange: (value: number) =>
									useSettings.getState().setSettings({
										linkedFolderLimit: value,
									}),
							});
						},
					},
				],
			},

			// Group view
			{
				type: "group",
				heading: "Group view",
				visible: () => !loadDisableOnThisDevice(),
				items: [
					{
						name: "Show metadata in continuous view",
						control: {
							type: "toggle",
							key: "continuousViewShowMetadata",
						},
					},
					{
						name: "Show backlinks in continuous view",
						control: {
							type: "toggle",
							key: "continuousViewShowBacklinks",
						},
					},
					{
						name: "Column view tab width",
						desc: "Minimum width of each tab in the column view in pixels.",
						render: (setting) => {
							this.setSlider(setting, {
								value: {
									currentValue:
										this.plugin.settings.columnViewMinWidth,
									defaultValue: 300,
									limits: { min: 200, max: 1000, step: 10 },
								},
								onChange: (value: number) =>
									useSettings
										.getState()
										.setGroupViewOptions(this.app, {
											columnViewMinWidth: value,
										}),
							});
						},
					},
					{
						name: "Show mission control toggle button",
						desc: "Show a button in the tab bar to activate the mission control view.",
						control: {
							type: "toggle",
							key: "enableMissionControlToggle",
						},
					},
					{
						name: "Zoom factor in mission control view",
						desc: "Adjust the page size in mission control view.",
						render: (setting) => {
							this.setSlider(setting, {
								value: {
									currentValue:
										this.plugin.settings
											.missionControlViewZoomFactor,
									defaultValue: 0.5,
									limits: { min: 0.5, max: 1, step: 0.1 },
								},
								onChange: (value: number) =>
									useSettings
										.getState()
										.setGroupViewOptions(this.app, {
											missionControlViewZoomFactor: value,
										}),
							});
						},
					},
					{
						name: "Disable pointer in mission control view",
						desc: "Prevents interaction with tab content when in mission control view, allowing easier navigation between tabs.",
						control: {
							type: "toggle",
							key: "disablePointerInMissionControlView",
						},
					},
				],
			},

			// Miscellaneous
			{
				type: "group",
				heading: "Miscellaneous",
				items: [
					{
						name: "Disable on this device",
						desc: "Disable Vertical Tabs on this device only. The plugin will remain enabled on other devices. This setting is stored locally and will not sync across devices.",
						render: (setting) => {
							setting.addToggle((toggle) =>
								toggle
									.setValue(loadDisableOnThisDevice())
									.onChange((value) =>
										this.toggleDisableOnThisDevice(value)
									)
							);
						},
					},
					{
						name: "Background mode",
						desc: "Enable to keep features like tab navigation without showing vertical tabs. This will disable Zen Mode and reset your workspace to the default layout.",
						render: (setting) => {
							setting.addToggle((toggle) =>
								toggle
									.setValue(
										this.plugin.settings.backgroundMode
									)
									.onChange((value) =>
										this.toggleBackgroundMode(value)
									)
							);
						},
					},
					{
						name: "Check for updates",
						desc: "Automatically check for updates when opening the settings tab.",
						render: (setting) => {
							void this.__displayUpdateCheckToggle(setting);
						},
					},
				],
			},

			// Support section
			{
				type: "group",
				items: [
					{
						name: "",
						searchable: false,
						render: (setting, group) => {
							setting.settingEl.addClass("vt-dummy-item");
							this.displaySupportSection(group.groupEl);
						},
					},
				],
			},
		];
	}
}
