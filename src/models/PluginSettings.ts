export enum TabVisibility {
	AllVisible = "allVisible",
	ActiveOnly = "activeOnly",
}

interface ObsidianVerticalTabsSettings {
	tabVisibility: TabVisibility;
	includeSidebars: boolean;
	sidebarTabTypes: string[] | null;
	sidebarExcludeSelf: boolean;
}

export const DEFAULT_SETTINGS: ObsidianVerticalTabsSettings = {
	tabVisibility: TabVisibility.ActiveOnly,
	includeSidebars: false,
	sidebarTabTypes: ["markdown"],
	sidebarExcludeSelf: true,
};

export type Settings = ObsidianVerticalTabsSettings;
export type SettingsMutation = Settings | Partial<Settings>;
export type SettingsMutator = (settings: Settings) => SettingsMutation;
