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
	toggleTabVisibility: () => void;
	toggleSidebarVisibility: () => void;
	toggleZenMode: () => void;
	toggleAlwaysOpenInNewTab: () => void;
	toggleDeduplicateTabs: () => void;
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
		toggleTabVisibility() {
			get().setSettings({ showActiveTabs: !get().showActiveTabs });
		},
		toggleSidebarVisibility() {
			get().setSettings({ hideSidebars: !get().hideSidebars });
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
		toggleAlwaysOpenInNewTab() {
			const alwaysOpenInNewTab = !get().alwaysOpenInNewTab;
			get().setSettings({ alwaysOpenInNewTab });
		},
		toggleDeduplicateTabs() {
			get().setSettings({ deduplicateTabs: !get().deduplicateTabs });
		},
	})
);

export const useSettings = createSelectors(useSettingsBase);
