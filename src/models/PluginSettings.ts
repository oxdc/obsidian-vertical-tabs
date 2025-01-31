import { TabNavigationStrategy } from "./TabNavigation";

interface ObsidianVerticalTabsSettings {
	showActiveTabs: boolean;
	autoUncollapseGroup: boolean;
	hideSidebars: boolean;
	sidebarTabTypes: string[] | null;
	sidebarExcludeSelf: boolean;
	trimTabNames: boolean;
	showMoreButtons: boolean;
	zenMode: boolean;
	enableTabZoom: boolean;
	alwaysOpenInNewTab: boolean;
	deduplicateTabs: boolean;
	ephemeralTabs: boolean;
	smartNavigation: boolean;
	navigationStrategy: TabNavigationStrategy;
	autoCloseEphemeralTabs: boolean;
	deduplicateSidebarTabs: boolean;
	continuousViewShowMetadata: boolean;
	continuousViewShowBacklinks: boolean;
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
	zenMode: false,
	enableTabZoom: false,
	alwaysOpenInNewTab: false,
	deduplicateTabs: false,
	ephemeralTabs: false,
	smartNavigation: true,
	navigationStrategy: TabNavigationStrategy.ObsidianPlus,
	autoCloseEphemeralTabs: true,
	deduplicateSidebarTabs: false,
	continuousViewShowMetadata: false,
	continuousViewShowBacklinks: false,
	backgroundMode: false,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;
