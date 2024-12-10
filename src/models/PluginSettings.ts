interface ObsidianVerticalTabsSettings {
	showActiveTabs: boolean;
	hideSidebars: boolean;
	sidebarTabTypes: string[] | null;
	sidebarExcludeSelf: boolean;
	zenMode: boolean;
	enableTabZoom: boolean;
	alwaysOpenInNewTab: boolean;
	deduplicateTabs: boolean;
	enableEphemeralTabs: boolean;
	smartNavigation: boolean;
}

export const DEFAULT_SETTINGS: ObsidianVerticalTabsSettings = {
	showActiveTabs: true,
	hideSidebars: true,
	sidebarTabTypes: ["markdown"],
	sidebarExcludeSelf: true,
	zenMode: false,
	enableTabZoom: true,
	alwaysOpenInNewTab: false,
	deduplicateTabs: false,
	enableEphemeralTabs: false,
	smartNavigation: true,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;
