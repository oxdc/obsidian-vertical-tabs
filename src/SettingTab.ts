import { App, PluginSettingTab, Setting } from "obsidian";
import ObsidianVerticalTabs from "./main";
import { useSettings, useSettingsBase } from "./models/PluginContext";
import { TabNavigationStrategyOptions } from "./models/TabNavigation";

export class ObsidianVerticalTabsSettingTab extends PluginSettingTab {
	plugin: ObsidianVerticalTabs;

	constructor(app: App, plugin: ObsidianVerticalTabs) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Show active tabs only")
			.setDesc("Hide inactive horizontal tabs.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showActiveTabs)
					.onChange(async () => {
						useSettings.getState().toggleTabVisibility();
					});
			});

		new Setting(containerEl).setName("Tab navigation").setHeading();

		new Setting(containerEl)
			.setName("Navigation strategy")
			.setDesc(
				"Controls the navigation behavior when new notes are opened."
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions(TabNavigationStrategyOptions)
					.setValue(this.plugin.settings.navigationStrategy)
					.onChange(async (value) => {
						useSettingsBase
							.getState()
							.setTabNavigationStrategy(value);
					})
			);
	}
}
