import { TabNavigationStrategy } from "./TabNavigation";

interface ObsidianVerticalTabsSettings {
	showActiveTabs: boolean;
	autoUncollapseGroup: boolean;
	hideSidebars: boolean;
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
	disableOnThisDevice: boolean;
	allowWorkspaceSplitOnPhone: boolean;
	enableUpdateCheck: boolean;
	showNewTabButtonAtBottom: boolean;
}

export const DEFAULT_SETTINGS: ObsidianVerticalTabsSettings = {
	showActiveTabs: false,
	autoUncollapseGroup: false,
	hideSidebars: true,
	sidebarExcludeSelf: true,
	trimTabNames: false,
	showMoreButtons: false,
	useTabEditing: true,
	zenMode: false,
	showActiveTabsInZenMode: false,
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
	scrollableTabs: true,
	scrollableTabsMinWidth: 100,
	autoHideHorizontalTabs: false,
	disableOnThisDevice: false,
	allowWorkspaceSplitOnPhone: false,
	enableUpdateCheck: true,
	showNewTabButtonAtBottom: false,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;

// prettier-ignore
export function validateAndNormalizeSettings(settings: unknown): Settings {
	const normalized: Settings = { ...DEFAULT_SETTINGS };

	if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
		return normalized;
	}

	const input = settings as Record<string, unknown>;

	if ("showActiveTabs" in input && typeof input.showActiveTabs === "boolean") {
		normalized.showActiveTabs = input.showActiveTabs;
	}
	if ("autoUncollapseGroup" in input && typeof input.autoUncollapseGroup === "boolean") {
		normalized.autoUncollapseGroup = input.autoUncollapseGroup;
	}
	if ("hideSidebars" in input && typeof input.hideSidebars === "boolean") {
		normalized.hideSidebars = input.hideSidebars;
	}
	if ("sidebarExcludeSelf" in input && typeof input.sidebarExcludeSelf === "boolean") {
		normalized.sidebarExcludeSelf = input.sidebarExcludeSelf;
	}
	if ("trimTabNames" in input && typeof input.trimTabNames === "boolean") {
		normalized.trimTabNames = input.trimTabNames;
	}
	if ("showMoreButtons" in input && typeof input.showMoreButtons === "boolean") {
		normalized.showMoreButtons = input.showMoreButtons;
	}
	if ("useTabEditing" in input && typeof input.useTabEditing === "boolean") {
		normalized.useTabEditing = input.useTabEditing;
	}
	if ("zenMode" in input && typeof input.zenMode === "boolean") {
		normalized.zenMode = input.zenMode;
	}
	if ("showActiveTabsInZenMode" in input && typeof input.showActiveTabsInZenMode === "boolean") {
		normalized.showActiveTabsInZenMode = input.showActiveTabsInZenMode;
	}
	if ("enableTabZoom" in input && typeof input.enableTabZoom === "boolean") {
		normalized.enableTabZoom = input.enableTabZoom;
	}
	if ("enhancedKeyboardTabSwitch" in input && typeof input.enhancedKeyboardTabSwitch === "boolean") {
		normalized.enhancedKeyboardTabSwitch = input.enhancedKeyboardTabSwitch;
	}
	if ("alwaysOpenInNewTab" in input && typeof input.alwaysOpenInNewTab === "boolean") {
		normalized.alwaysOpenInNewTab = input.alwaysOpenInNewTab;
	}
	if ("deduplicateTabs" in input && typeof input.deduplicateTabs === "boolean") {
		normalized.deduplicateTabs = input.deduplicateTabs;
	}
	if ("ephemeralTabs" in input && typeof input.ephemeralTabs === "boolean") {
		normalized.ephemeralTabs = input.ephemeralTabs;
	}
	if ("smartNavigation" in input && typeof input.smartNavigation === "boolean") {
		normalized.smartNavigation = input.smartNavigation;
	}
	if ("autoCloseEphemeralTabs" in input && typeof input.autoCloseEphemeralTabs === "boolean") {
		normalized.autoCloseEphemeralTabs = input.autoCloseEphemeralTabs;
	}
	if ("deduplicateSameGroupTabs" in input && typeof input.deduplicateSameGroupTabs === "boolean") {
		normalized.deduplicateSameGroupTabs = input.deduplicateSameGroupTabs;
	}
	if ("deduplicateSidebarTabs" in input && typeof input.deduplicateSidebarTabs === "boolean") {
		normalized.deduplicateSidebarTabs = input.deduplicateSidebarTabs;
	}
	if ("deduplicatePopupTabs" in input && typeof input.deduplicatePopupTabs === "boolean") {
		normalized.deduplicatePopupTabs = input.deduplicatePopupTabs;
	}
	if ("continuousViewShowMetadata" in input && typeof input.continuousViewShowMetadata === "boolean") {
		normalized.continuousViewShowMetadata = input.continuousViewShowMetadata;
	}
	if ("continuousViewShowBacklinks" in input && typeof input.continuousViewShowBacklinks === "boolean") {
		normalized.continuousViewShowBacklinks = input.continuousViewShowBacklinks;
	}
	if ("disablePointerInMissionControlView" in input && typeof input.disablePointerInMissionControlView === "boolean") {
		normalized.disablePointerInMissionControlView = input.disablePointerInMissionControlView;
	}
	if ("backgroundMode" in input && typeof input.backgroundMode === "boolean") {
		normalized.backgroundMode = input.backgroundMode;
	}
	if ("scrollableTabs" in input && typeof input.scrollableTabs === "boolean") {
		normalized.scrollableTabs = input.scrollableTabs;
	}
	if ("autoHideHorizontalTabs" in input && typeof input.autoHideHorizontalTabs === "boolean") {
		normalized.autoHideHorizontalTabs = input.autoHideHorizontalTabs;
	}
	if ("disableOnThisDevice" in input && typeof input.disableOnThisDevice === "boolean") {
		normalized.disableOnThisDevice = input.disableOnThisDevice;
	}
	if ("allowWorkspaceSplitOnPhone" in input && typeof input.allowWorkspaceSplitOnPhone === "boolean") {
		normalized.allowWorkspaceSplitOnPhone = input.allowWorkspaceSplitOnPhone;
	}
	if ("enableUpdateCheck" in input && typeof input.enableUpdateCheck === "boolean") {
		normalized.enableUpdateCheck = input.enableUpdateCheck;
	}
	if ("showNewTabButtonAtBottom" in input && typeof input.showNewTabButtonAtBottom === "boolean") {
		normalized.showNewTabButtonAtBottom = input.showNewTabButtonAtBottom;
	}
	if ("linkedFolderLimit" in input) {
		const value = Number(input.linkedFolderLimit);
		if (isFinite(value) && !isNaN(value)) {
			normalized.linkedFolderLimit = value;
		}
	}
	if ("columnViewMinWidth" in input) {
		const value = Number(input.columnViewMinWidth);
		if (isFinite(value) && !isNaN(value)) {
			normalized.columnViewMinWidth = value;
		}
	}
	if ("missionControlViewZoomFactor" in input) {
		const value = Number(input.missionControlViewZoomFactor);
		if (isFinite(value) && !isNaN(value)) {
			normalized.missionControlViewZoomFactor = value;
		}
	}
	if ("scrollableTabsMinWidth" in input) {
		const value = Number(input.scrollableTabsMinWidth);
		if (isFinite(value) && !isNaN(value)) {
			normalized.scrollableTabsMinWidth = value;
		}
	}
	if ("navigationStrategy" in input && typeof input.navigationStrategy === "string") {
		const validStrategies = Object.values(TabNavigationStrategy);
		if (validStrategies.includes(input.navigationStrategy as TabNavigationStrategy)) {
			normalized.navigationStrategy = input.navigationStrategy as TabNavigationStrategy;
		}
	}
	if ("linkedFolderSortStrategy" in input && typeof input.linkedFolderSortStrategy === "string") {
		normalized.linkedFolderSortStrategy = input.linkedFolderSortStrategy;
	}

	return normalized;
}
