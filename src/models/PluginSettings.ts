import { TabNavigationStrategy } from "./TabNavigation";

interface ObsidianVerticalTabsSettings {
	installationID?: string;
	showActiveTabs: boolean;
	autoUncollapseGroup: boolean;
	hideSidebars: boolean;
	sidebarTabTypes: string[] | null;
	sidebarExcludeSelf: boolean;
	trimTabNames: boolean;
	showMoreButtons: boolean;
	useTabEditing: boolean;
	zenMode: boolean;
	enableTabZoom: boolean;
	enhancedKeyboardTabSwitch: boolean;
	alwaysOpenInNewTab: boolean;
	deduplicateTabs: boolean;
	ephemeralTabs: boolean;
	smartNavigation: boolean;
	navigationStrategy: TabNavigationStrategy;
	autoCloseEphemeralTabs: boolean;
	deduplicateSidebarTabs: boolean;
	deduplicatePopupTabs: boolean;
	backgroundMode: boolean;
}

export const DEFAULT_SETTINGS: ObsidianVerticalTabsSettings = {
	showActiveTabs: false,
	autoUncollapseGroup: false,
	hideSidebars: true,
	sidebarTabTypes: ["markdown"],
	sidebarExcludeSelf: true,
	trimTabNames: false,
	showMoreButtons: false,
	useTabEditing: true,
	zenMode: false,
	enableTabZoom: false,
	enhancedKeyboardTabSwitch: false,
	alwaysOpenInNewTab: false,
	deduplicateTabs: false,
	ephemeralTabs: false,
	smartNavigation: true,
	navigationStrategy: TabNavigationStrategy.ObsidianPlus,
	autoCloseEphemeralTabs: true,
	deduplicateSidebarTabs: false,
	deduplicatePopupTabs: false,
	backgroundMode: false,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;
