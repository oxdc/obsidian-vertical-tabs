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
	selfIsNotInTheSidebar,
} from "src/services/MoveTab";
import {
	refreshGroupViewTypes,
	setColumnViewMinWidth,
	setMissionControlViewZoomFactor,
} from "./VTGroupView";
import { EVENTS } from "src/constants/Events";
import { PersistenceManager } from "./PersistenceManager";
import { setShowActiveTabs, getShowActiveTabs } from "src/history/Migration";
import { setScrollableTabsMinWidth } from "src/services/ScrollableTabs";

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

export const usePersistenceManager = (): PersistenceManager => {
	const plugin = usePlugin();
	return plugin.persistenceManager;
};

export type GroupViewOptions = {
	continuousViewShowMetadata?: boolean;
	continuousViewShowBacklinks?: boolean;
	columnViewMinWidth?: number;
	missionControlViewZoomFactor?: number;
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
			setColumnViewMinWidth(settings.columnViewMinWidth);
			setMissionControlViewZoomFactor(
				settings.missionControlViewZoomFactor
			);
			setScrollableTabsMinWidth(settings.scrollableTabsMinWidth);
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
			const { zenMode, showActiveTabs, showActiveTabsInZenMode } = get();
			if (zenMode) {
				const showActiveTabs = getShowActiveTabs();
				get().setSettings({ zenMode: false, showActiveTabs });
			} else {
				setShowActiveTabs(showActiveTabs);
				if (showActiveTabsInZenMode) {
					get().setSettings({ zenMode: true, showActiveTabs: true });
				} else {
					get().setSettings({ zenMode: true });
				}
			}
		},
		updateEphemeralTabs(app: App) {
			const { ephemeralTabs, autoCloseEphemeralTabs } = get();
			app.workspace.trigger(
				EVENTS.EPHEMERAL_TABS_UPDATE,
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
				app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
			}
			if (ephemeralTabs) {
				app.workspace.trigger(
					EVENTS.EPHEMERAL_TABS_INIT,
					autoCloseEphemeralTabs
				);
			} else {
				app.workspace.trigger(EVENTS.EPHEMERAL_TABS_DEINIT);
			}
		},
		toggleBackgroundMode(app: App, enable?: boolean) {
			const { backgroundMode, showActiveTabs } = get();
			if (enable === backgroundMode) return;
			const toEnable = enable ?? !backgroundMode;
			setShowActiveTabs(showActiveTabs);
			if (toEnable) {
				get().setSettings({
					backgroundMode: true,
					showActiveTabs: false, // ensure access to all horizontal tabs
					zenMode: false, // ensure access to all splits
				});
				moveSelfToNewGroupAndHide(app);
			} else {
				const showActiveTabs = getShowActiveTabs();
				get().setSettings({ backgroundMode: false, showActiveTabs });
				if (selfIsNotInTheSidebar(app)) {
					moveSelfToDefaultLocation(app);
				}
			}
		},
		toggleEnhancedKeyboardTabSwitch(app: App, enable?: boolean) {
			const { enhancedKeyboardTabSwitch } = get();
			const toEnable = enable ?? !enhancedKeyboardTabSwitch;
			if (toEnable) {
				app.workspace.trigger(EVENTS.ENHANCED_KEYBOARD_TAB_SWITCH);
			} else {
				app.workspace.trigger(EVENTS.RESET_KEYBOARD_TAB_SWITCH);
			}
			get().setSettings({ enhancedKeyboardTabSwitch: toEnable });
		},
		setGroupViewOptions(app: App, options: GroupViewOptions) {
			get().setSettings(options);
			refreshGroupViewTypes(app);
			const { columnViewMinWidth, missionControlViewZoomFactor } =
				options;
			if (columnViewMinWidth) {
				setColumnViewMinWidth(columnViewMinWidth);
			}
			if (missionControlViewZoomFactor) {
				setMissionControlViewZoomFactor(missionControlViewZoomFactor);
			}
		},
	})
);

export const useSettings = createSelectors(useSettingsBase);
