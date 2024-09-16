interface ObsidianVerticalTabsSettings {
	showActiveTabs: boolean;
	hideSidebars: boolean;
	sidebarTabTypes: string[] | null;
	excludeSelf: boolean;
	zenMode: boolean;
}

export const DEFAULT_SETTINGS: ObsidianVerticalTabsSettings = {
	showActiveTabs: true,
	hideSidebars: true,
	sidebarTabTypes: ["markdown"],
	excludeSelf: true,
	zenMode: false,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutatorFn = (settings: Settings) => SettingsMutation;
export type SettingsMutator = SettingsMutation | SettingsMutatorFn;
