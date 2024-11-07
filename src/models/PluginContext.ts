import { App, EventRef, FileView, TFile } from "obsidian";
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
import {
	deduplicateExistingTabs,
	deduplicateTab,
} from "src/services/DeduplicateTab";

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
	toggleAlwaysOpenInNewTab: (app: App) => void;
	disableNavigation: (app: App) => void;
	resetNavigation: (app: App) => void;
	setNavigation: (app: App) => void;
	toggleDeduplicateTabs: (app: App) => void;
	deduplicateTasks: EventRef[];
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
		toggleAlwaysOpenInNewTab(app) {
			const alwaysOpenInNewTab = !get().alwaysOpenInNewTab;
			get().setSettings({ alwaysOpenInNewTab });
			get().setNavigation(app);
		},
		disableNavigation: (app) => {
			app.workspace.iterateRootLeaves((leaf) => {
				leaf.view.navigation = false;
			});
		},
		resetNavigation: (app) => {
			app.workspace.iterateRootLeaves((leaf) => {
				// todo: save original navigation state
				leaf.view.navigation = true;
			});
		},
		setNavigation: (app) => {
			if (get().alwaysOpenInNewTab) {
				get().disableNavigation(app);
			} else {
				get().resetNavigation(app);
			}
		},
		toggleDeduplicateTabs(app) {
			const deduplicateTabs = !get().deduplicateTabs;
			get().setSettings({ deduplicateTabs });
			if (deduplicateTabs) {
				const deduplicateTasks = [
					app.workspace.on("file-open", (file) =>
						deduplicateTab(app, file)
					),
					app.workspace.on("active-leaf-change", (leaf) => {
						const path = leaf?.getViewState().state?.file as string;
						if (leaf instanceof FileView) {
							deduplicateTab(app, leaf.file);
						} else if (path) {
							const file = app.vault.getAbstractFileByPath(path);
							if (file instanceof TFile)
								deduplicateTab(app, file);
						}
					}),
				];
				set({ deduplicateTasks });
				const plugin = get().plugin;
				if (plugin)
					deduplicateTasks.forEach((task) =>
						plugin.registerEvent(task)
					);
				deduplicateExistingTabs(app);
			} else {
				get().deduplicateTasks.forEach((task) =>
					app.workspace.offref(task)
				);
				set({ deduplicateTasks: [] });
			}
		},
	})
);

export const useSettings = createSelectors(useSettingsBase);
