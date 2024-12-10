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
import { deduplicateExistingTabs } from "src/services/DeduplicateTab";

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

interface SettingsActions {
	plugin: ObsidianVerticalTabs | null;
	loadSettings: (plugin: ObsidianVerticalTabs) => Promise<void>;
	setSettings: (mutator: SettingsMutator) => void;
	toggleZenMode: () => void;
	updateEphemeralTabs: (app: App) => void;
	setTabNavigationStrategy: (app: App, name: string) => void;
}

export const useSettingsBase = create<Settings & SettingsActions>(
	(set, get) => ({
		...DEFAULT_SETTINGS,
		plugin: null,
		deduplicateTasks: [],
		loadSettings: async (plugin) => {
			set({ plugin });
			await plugin.loadData();
			const settings = plugin.settings;
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
				const showActiveTabs =
					localStorage.getItem("vt-show-active-tabs") === "true";
				get().setSettings({ zenMode: false, showActiveTabs });
			} else {
				localStorage.setItem(
					"vt-show-active-tabs",
					showActiveTabs.toString()
				);
				get().setSettings({ zenMode: true, showActiveTabs: true });
			}
		},
		updateEphemeralTabs(app: App) {
			const { ephemeralTabs } = get();
			app.workspace.trigger(
				"vertical-tabs:ephemeral-tabs",
				ephemeralTabs
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
						ephemeralTabs: false,
						smartNavigation: false,
					});
					break;
				case TabNavigationStrategy.ObsidianPlus:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: false,
						ephemeralTabs: false,
						smartNavigation: true,
					});
					break;
				case TabNavigationStrategy.IDE:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: true,
						ephemeralTabs: true,
						smartNavigation: true,
					});
					break;
				case TabNavigationStrategy.Explorer:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: false,
						ephemeralTabs: true,
						smartNavigation: false,
					});
					break;
				case TabNavigationStrategy.Notebook:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: true,
						ephemeralTabs: false,
						smartNavigation: true,
					});
					break;
				case TabNavigationStrategy.PreferNewTab:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: true,
						deduplicateTabs: false,
						ephemeralTabs: false,
						smartNavigation: false,
					});
					break;
				case TabNavigationStrategy.Custom:
					get().setSettings({
						navigationStrategy: strategy,
						alwaysOpenInNewTab: false,
						deduplicateTabs: false,
						ephemeralTabs: false,
						smartNavigation: true,
					});
					break;
			}
			const { deduplicateTabs, ephemeralTabs } = get();
			if (deduplicateTabs) {
				deduplicateExistingTabs(app);
			}
			app.workspace.trigger(
				"vertical-tabs:ephemeral-tabs",
				ephemeralTabs
			);
		},
	})
);

export const useSettings = createSelectors(useSettingsBase);
