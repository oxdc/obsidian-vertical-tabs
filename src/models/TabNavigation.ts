export enum TabNavigationStrategy {
	ObsidianPlus = "obsidian-plus",
	Obsidian = "obsidian",
	IDE = "ide",
	Explorer = "explorer",
	Notebook = "notebook",
	PreferNewTab = "prefer-new-tab",
	Custom = "custom",
}

export const TabNavigationStrategyPresetOptions: Record<string, string> = {
	[TabNavigationStrategy.ObsidianPlus]: "Obsidian+",
	[TabNavigationStrategy.Obsidian]: "Obsidian",
	[TabNavigationStrategy.IDE]: "IDE",
	[TabNavigationStrategy.Explorer]: "Explorer",
	[TabNavigationStrategy.Notebook]: "Notebook",
	[TabNavigationStrategy.PreferNewTab]: "Prefer new tab",
};

export const TabNavigationStrategyOptions: Record<string, string> = {
	...TabNavigationStrategyPresetOptions,
	[TabNavigationStrategy.Custom]: "Custom",
};

export const TabNavigationCopyOptions: Record<string, string> = {
	"--copy--": "-- Choose a preset --",
	...TabNavigationStrategyPresetOptions,
};

export function convertNameToStrategy(name: string): TabNavigationStrategy {
	return name as TabNavigationStrategy;
}

export type TabNavigationStrategySettings = {
	alwaysOpenInNewTab: boolean;
	deduplicateTabs: boolean;
	deduplicateSameGroupTabs: boolean;
	deduplicateSidebarTabs: boolean;
	deduplicatePopupTabs: boolean;
	ephemeralTabs: boolean;
	autoCloseEphemeralTabs: boolean;
	smartNavigation: boolean;
};

export type TabNavigationRecipes = {
	[key in TabNavigationStrategy]: TabNavigationStrategySettings;
};

export const TabNavigationPresets: TabNavigationRecipes = {
	obsidian: {
		alwaysOpenInNewTab: false,
		deduplicateTabs: false,
		deduplicateSameGroupTabs: false,
		deduplicateSidebarTabs: false,
		deduplicatePopupTabs: false,
		ephemeralTabs: false,
		autoCloseEphemeralTabs: false,
		smartNavigation: false,
	},
	"obsidian-plus": {
		alwaysOpenInNewTab: false,
		deduplicateTabs: false,
		deduplicateSameGroupTabs: false,
		deduplicateSidebarTabs: false,
		deduplicatePopupTabs: false,
		ephemeralTabs: false,
		autoCloseEphemeralTabs: false,
		smartNavigation: true,
	},
	ide: {
		alwaysOpenInNewTab: false,
		deduplicateTabs: true,
		deduplicateSameGroupTabs: false,
		deduplicateSidebarTabs: false,
		deduplicatePopupTabs: false,
		ephemeralTabs: true,
		autoCloseEphemeralTabs: true,
		smartNavigation: true,
	},
	explorer: {
		alwaysOpenInNewTab: false,
		deduplicateTabs: false,
		deduplicateSameGroupTabs: false,
		deduplicateSidebarTabs: false,
		deduplicatePopupTabs: false,
		ephemeralTabs: true,
		autoCloseEphemeralTabs: true,
		smartNavigation: false,
	},
	notebook: {
		alwaysOpenInNewTab: true,
		deduplicateTabs: true,
		deduplicateSameGroupTabs: false,
		deduplicateSidebarTabs: false,
		deduplicatePopupTabs: false,
		ephemeralTabs: false,
		autoCloseEphemeralTabs: false,
		smartNavigation: true,
	},
	"prefer-new-tab": {
		alwaysOpenInNewTab: true,
		deduplicateTabs: false,
		deduplicateSameGroupTabs: false,
		deduplicateSidebarTabs: false,
		deduplicatePopupTabs: false,
		ephemeralTabs: false,
		autoCloseEphemeralTabs: false,
		smartNavigation: false,
	},
	custom: {
		alwaysOpenInNewTab: false,
		deduplicateTabs: false,
		deduplicateSameGroupTabs: false,
		deduplicateSidebarTabs: false,
		deduplicatePopupTabs: false,
		ephemeralTabs: false,
		autoCloseEphemeralTabs: false,
		smartNavigation: true,
	},
};
