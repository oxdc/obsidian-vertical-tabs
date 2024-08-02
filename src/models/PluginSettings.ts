interface ObsidianVerticalTabsSettings {
	showActiveTabs: boolean;
	hideSidebars: boolean;
	sidebarTabTypes: string[] | null;
	sidebarExcludeSelf: boolean;
}

export const DEFAULT_SETTINGS: ObsidianVerticalTabsSettings = {
	showActiveTabs: true,
	hideSidebars: true,
	sidebarTabTypes: ["markdown"],
	sidebarExcludeSelf: true,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;
