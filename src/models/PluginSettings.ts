import { TabNavigationStrategy } from "./TabNavigation";

interface ObsidianVerticalTabsSettings {
	installationID?: string;
	showActiveTabs: boolean;
	autoUncollapseGroup: boolean;
	hideSidebars: boolean;
	trimTabNames: boolean;
	showMoreButtons: boolean;
	useTabEditing: boolean;
	zenMode: boolean;
	showActiveTabsInZenMode: boolean;
	enableTabZoom: boolean;
	enhancedKeyboardTabSwitch: boolean;
	alwaysOpenInNewTab: boolean;
	deduplicateTabs: boolean;
	ephemeralTabs: boolean;
	smartNavigation: boolean;
	navigationStrategy: TabNavigationStrategy;
	autoCloseEphemeralTabs: boolean;
	deduplicateSameGroupTabs: boolean;
	deduplicateSidebarTabs: boolean;
	deduplicatePopupTabs: boolean;
	linkedFolderLimit: number;
	linkedFolderSortStrategy: string;
	continuousViewShowMetadata: boolean;
	continuousViewShowBacklinks: boolean;
	columnViewMinWidth: number;
	backgroundMode: boolean;
}

export const DEFAULT_SETTINGS: ObsidianVerticalTabsSettings = {
	showActiveTabs: false,
	autoUncollapseGroup: false,
	hideSidebars: true,
	trimTabNames: false,
	showMoreButtons: false,
	useTabEditing: true,
	zenMode: false,
	showActiveTabsInZenMode: true,
	enableTabZoom: false,
	enhancedKeyboardTabSwitch: false,
	alwaysOpenInNewTab: false,
	deduplicateTabs: false,
	ephemeralTabs: false,
	smartNavigation: true,
	navigationStrategy: TabNavigationStrategy.ObsidianPlus,
	autoCloseEphemeralTabs: true,
	deduplicateSameGroupTabs: false,
	deduplicateSidebarTabs: false,
	deduplicatePopupTabs: false,
	linkedFolderLimit: 5,
	linkedFolderSortStrategy: "fileNameAToZ",
	columnViewMinWidth: 300,
	continuousViewShowMetadata: false,
	continuousViewShowBacklinks: false,
	backgroundMode: false,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;
