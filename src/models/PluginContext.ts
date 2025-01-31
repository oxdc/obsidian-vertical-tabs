import { App } from "obsidian";
import { createContext, useContext } from "react";
import ObsidianVerticalTabs from "src/main";
import {
	Settings,
	SettingsMutatorFn,
	SettingsMutator,
	SettingsMutation,
	DEFAULT_SETTINGS,
} from "./PluginSettings";
import { create } from "zustand";
import { createSelectors } from "./Selectors";
import { convertNameToStrategy, TabNavigationStrategy } from "./TabNavigation";
import {
	moveSelfToDefaultLocation,
	moveSelfToNewGroupAndHide,
} from "src/services/MoveTab";
import { refreshGroupViewTypes, setColumnViewMinWidth } from "./VTGroupView";

function saveShowActiveTabs(showActiveTabs: boolean) {
	localStorage.setItem("vt-show-active-tabs", showActiveTabs.toString());
}

function loadShowActiveTabs() {
	return localStorage.getItem("vt-show-active-tabs") === "true";
}

export type SettingsContext = [Settings, (mutator: SettingsMutator) => void];

export const PluginContext = createContext<ObsidianVerticalTabs | null>(null);

export const usePlugin = (): ObsidianVerticalTabs => {
	const plugin = useContext(PluginContext);
	if (!plugin) throw new Error("PluginContext not found");
	return plugin;
};

export const useApp = (): App => {
	const plugin = usePlugin();
	return plugin.app;
};

export type GroupViewOptions = {
	continuousViewShowMetadata?: boolean;
	continuousViewShowBacklinks?: boolean;
	columnViewMinWidth?: number;
};

interface SettingsActions {
	plugin: ObsidianVerticalTabs | null;
	loadSettings: (plugin: ObsidianVerticalTabs) => Promise<void>;
	setSettings: (mutator: SettingsMutator) => void;
	toggleZenMode: () => void;
	updateEphemeralTabs: (app: App) => void;
	setTabNavigationStrategy: (app: App, name: string) => void;
	toggleBackgroundMode: (app: App, enable?: boolean) => void;
	setGroupViewOptions: (app: App, options: GroupViewOptions) => void;
}

export const useSettingsBase = create<Settings & SettingsActions>(
	(set, get) => ({
		...DEFAULT_SETTINGS,
		plugin: null,
		loadSettings: async (plugin) => {
			set({ plugin });
			await plugin.loadData();
			const settings = plugin.settings;
			plugin.saveSettings();
			set(settings);
		},
		setSettings: (mutator: SettingsMutator) => {
			const { plugin } = get();
			if (!plugin) return;
			switch (typeof mutator) {
				case "object":
					plugin.settings = {
						...plugin.settings,
						...(mutator as SettingsMutation),
					};
					break;
				case "function":
					plugin.settings = {
						...plugin.settings,
						...(mutator as SettingsMutatorFn)(plugin.settings),
					};
					break;
			}
			plugin.saveSettings();
			plugin.updateViewStates();
			set({ ...plugin.settings });
		},
		toggleZenMode() {
			const { zenMode, showActiveTabs } = get();
			if (zenMode) {
				const showActiveTabs = loadShowActiveTabs();
				get().setSettings({ zenMode: false, showActiveTabs });
			} else {
				saveShowActiveTabs(showActiveTabs);
				get().setSettings({ zenMode: true, showActiveTabs: true });
			}
		},
		updateEphemeralTabs(app: App) {
			const { ephemeralTabs, autoCloseEphemeralTabs } = get();
			app.workspace.trigger(
				"vertical-tabs:ephemeral-tabs-update",
				ephemeralTabs,
				autoCloseEphemeralTabs
			);
		},
		setTabNavigationStrategy(app: App, name: string) {
			const strategy = convertNameToStrategy(name);
			switch (strategy) {
				case TabNavigationStrategy.Obsidian:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: false,
						deduplicateSidebarTabs: false,
						ephemeralTabs: false,
						autoCloseEphemeralTabs: false,
						smartNavigation: false,
					});
					break;
				case TabNavigationStrategy.ObsidianPlus:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: false,
						deduplicateSidebarTabs: false,
						ephemeralTabs: false,
						autoCloseEphemeralTabs: false,
						smartNavigation: true,
					});
					break;
				case TabNavigationStrategy.IDE:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: true,
						deduplicateSidebarTabs: false,
						ephemeralTabs: true,
						autoCloseEphemeralTabs: true,
						smartNavigation: true,
					});
					break;
				case TabNavigationStrategy.Explorer:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: false,
						deduplicateSidebarTabs: false,
						ephemeralTabs: true,
						autoCloseEphemeralTabs: true,
						smartNavigation: false,
					});
					break;
				case TabNavigationStrategy.Notebook:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: true,
						deduplicateSidebarTabs: false,
						ephemeralTabs: false,
						autoCloseEphemeralTabs: false,
						smartNavigation: true,
					});
					break;
				case TabNavigationStrategy.PreferNewTab:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: true,
						deduplicateTabs: false,
						deduplicateSidebarTabs: false,
						ephemeralTabs: false,
						autoCloseEphemeralTabs: false,
						smartNavigation: false,
					});
					break;
				case TabNavigationStrategy.Custom:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: false,
						deduplicateSidebarTabs: false,
						ephemeralTabs: false,
						autoCloseEphemeralTabs: false,
						smartNavigation: true,
					});
					break;
			}
			const { deduplicateTabs, ephemeralTabs, autoCloseEphemeralTabs } =
				get();
			if (deduplicateTabs) {
				app.workspace.trigger("vertical-tabs:deduplicate-tabs");
			}
			if (ephemeralTabs) {
				app.workspace.trigger(
					"vertical-tabs:ephemeral-tabs-init",
					autoCloseEphemeralTabs
				);
			} else {
				app.workspace.trigger("vertical-tabs:ephemeral-tabs-deinit");
			}
		},
		toggleBackgroundMode(app: App, enable?: boolean) {
			const { backgroundMode, showActiveTabs } = get();
			const toEnable = enable ?? !backgroundMode;
			if (toEnable) {
				saveShowActiveTabs(showActiveTabs);
				get().setSettings({
					backgroundMode: true,
					showActiveTabs: false, // ensure access to all horizontal tabs
					zenMode: false, // ensure access to all splits
				});
				moveSelfToNewGroupAndHide(app);
			} else {
				const showActiveTabs = loadShowActiveTabs();
				get().setSettings({ backgroundMode: false, showActiveTabs });
				moveSelfToDefaultLocation(app);
			}
		},
		setGroupViewOptions(app: App, options: GroupViewOptions) {
			get().setSettings(options);
			refreshGroupViewTypes(app);
			const { columnViewMinWidth } = options;
			if (columnViewMinWidth) {
				setColumnViewMinWidth(columnViewMinWidth);
			}
		},
	})
);

export const useSettings = createSelectors(useSettingsBase);
