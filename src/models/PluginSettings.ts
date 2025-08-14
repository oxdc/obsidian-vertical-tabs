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
	missionControlViewZoomFactor: number;
	disablePointerInMissionControlView: boolean;
	backgroundMode: boolean;
	scrollableTabs: boolean;
	scrollableTabsMinWidth: number;
	autoHideHorizontalTabs: boolean;
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
	missionControlViewZoomFactor: 0.5,
	disablePointerInMissionControlView: true,
	backgroundMode: false,
	scrollableTabs: false,
	scrollableTabsMinWidth: 100,
	autoHideHorizontalTabs: false,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;
