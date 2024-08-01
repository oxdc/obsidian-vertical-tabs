import { App } from "obsidian";
import { createContext, useContext, useState } from "react";
import ObsidianVerticalTabs from "src/main";
import {
	Settings,
	SettingsMutatorFn,
	SettingsMutator,
	SettingsMutation,
} from "./PluginSettings";

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

export const useSettings = (): SettingsContext => {
	const plugin = usePlugin();
	const [settings, setSettings] = useState(plugin.settings);
	const saveSettings = (mutator: SettingsMutator) => {
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
		setSettings(plugin.settings);
	};
	return [settings, saveSettings];
};
