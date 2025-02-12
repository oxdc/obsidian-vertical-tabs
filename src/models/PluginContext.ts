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
import {
	convertNameToStrategy,
	TabNavigationPresets,
	TabNavigationStrategySettings,
} from "./TabNavigation";
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
	loadSettings: (plugin: ObsidianVerticalTabs) => Promise<Settings>;
	setSettings: (mutator: SettingsMutator) => void;
	toggleZenMode: () => void;
	updateEphemeralTabs: (app: App) => void;
	setTabNavigationStrategy: (
		app: App,
		name: string,
		preset?: TabNavigationStrategySettings
	) => void;
	toggleBackgroundMode: (app: App, enable?: boolean) => void;
	toggleEnhancedKeyboardTabSwitch: (app: App, enable?: boolean) => void;
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
			return settings;
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
		setTabNavigationStrategy(
			app: App,
			name: string,
			preset?: TabNavigationStrategySettings
		) {
			const strategy = convertNameToStrategy(name);
			const settings = preset ?? TabNavigationPresets[strategy];
			get().setSettings({
				navigationStrategy: strategy,
				...settings,
			});
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
			saveShowActiveTabs(showActiveTabs);
			if (toEnable) {
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
		toggleEnhancedKeyboardTabSwitch(app: App, enable?: boolean) {
			const { enhancedKeyboardTabSwitch } = get();
			const toEnable = enable ?? !enhancedKeyboardTabSwitch;
			if (toEnable) {
				app.workspace.trigger(
					"vertical-tabs:enhanced-keyboard-tab-switch"
				);
			} else {
				app.workspace.trigger(
					"vertical-tabs:reset-keyboard-tab-switch"
				);
			}
			get().setSettings({ enhancedKeyboardTabSwitch: toEnable });
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
