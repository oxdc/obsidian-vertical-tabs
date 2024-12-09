import { App, PluginSettingTab, Setting } from "obsidian";
import ObsidianVerticalTabs from "./main";
import { useSettings } from "./models/PluginContext";
import {
	TabNavigationStrategy,
	TabNavigationStrategyOptions,
} from "./models/TabNavigation";

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
			.setDesc("Hide inactive horizontal tabs to make workspace cleaner.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.showActiveTabs)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ showActiveTabs: value });
					});
			});

		new Setting(containerEl)
			.setName("Hide sidebar tabs")
			.setDesc("Don't show sidebar tabs in Vertical Tabs.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.hideSidebars)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ hideSidebars: value });
					});
			});

		new Setting(containerEl)
			.setName("Trim tab names")
			.setDesc("Use ellipsis to fit tab names on a single line.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.trimTabNames)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ trimTabNames: value });
					});
			});

		new Setting(containerEl)
			.setName("Enable tab zoom")
			.setDesc("Enable per tab zooming.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.enableTabZoom)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ enableTabZoom: value });
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
						useSettings
							.getState()
							.setTabNavigationStrategy(this.app, value);
						this.display();
					})
			);

		switch (this.plugin.settings.navigationStrategy) {
			case TabNavigationStrategy.Obsidian:
				containerEl.createDiv({
					cls: "vt-setting-description",
					text:
						"Use the default navigation strategy of Obsidian. " +
						"When working with multiple tab groups, " +
						"new tabs may appear in unexpected locations.",
				});
				break;
			case TabNavigationStrategy.ObsidianPlus:
				containerEl.createDiv({
					cls: "vt-setting-description",
					text:
						"Use enhanced navigation strategy implemented by Vertical Tabs. " +
						"New tabs will be opened in a consistent and intuitive manner.",
				});
				break;
			case TabNavigationStrategy.IDE:
				containerEl.createDiv({
					cls: "vt-setting-description",
					text:
						"Use IDE-like navigation strategy. " +
						"Recommended for users familiar with VSCode, Xcode, or other IDEs.",
				});
				break;
			case TabNavigationStrategy.Explorer:
				containerEl.createDiv({
					cls: "vt-setting-description",
					text: "Explorer mode uses ephemeral tabs to avoid opening too many tabs.",
				});
				break;
			case TabNavigationStrategy.Notebook:
				containerEl.createDiv({
					cls: "vt-setting-description",
					text: "Notebook mode ensures consistent navigation behavior while avoiding duplication.",
				});
				break;
			case TabNavigationStrategy.PreferNewTab:
				containerEl.createDiv({
					cls: "vt-setting-description",
					text: "Always open the new note in a new tab.",
				});
				break;
			case TabNavigationStrategy.Custom:
				this.displayCustomNavigationStrategy(containerEl);
				break;
		}

		containerEl.createDiv({ cls: "vt-support" }).innerHTML = `
			<div class="title">Enjoying Vertical Tabs?</div>
			<div class="buttons">
				<a id="vt-support-btn-kofi" href="https://ko-fi.com/oxdcq" target="_blank">
					<img
						height="16"
						border="0"
						style="border: 0px; height: 16px;"
						src="https://storage.ko-fi.com/cdn/brandasset/v2/kofi_symbol.png"
					/>
					<span>Buy me a coffee</span>
				</a>
				<a id="vt-support-btn-github" href="https://github.com/oxdc/obsidian-vertical-tabs" target="_blank">
					<img
						height="16"
						border="0"
						style="border: 0px; height: 16px;"
						src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
					/>
					<span>Star on GitHub</span>
				</a>
			</div>
			<div class="bug-report">
				Facing issues or have suggestions? <a href="https://github.com/oxdc/obsidian-vertical-tabs/issues/new/choose" target="_blank">Submit a report</a>.
			</div>
		`;
	}

	private displayCustomNavigationStrategy(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Always open in new tab")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.alwaysOpenInNewTab)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ alwaysOpenInNewTab: value });
						this.display();
					});
			});

		if (!this.plugin.settings.alwaysOpenInNewTab) {
			new Setting(containerEl)
				.setName("Smart navigation")
				.setDesc(
					"Ensures consistent and intuitive behavior when working with multiple tab groups."
				)
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.smartNavigation)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ smartNavigation: value });
						});
				});

			new Setting(containerEl)
				.setName("Enable ephemeral tabs")
				.setDesc("Bring VSCode-like ephemeral tabs to Obsidian.")
				.addToggle((toggle) => {
					toggle
						.setValue(this.plugin.settings.ephemeralTabs)
						.onChange(async (value) => {
							useSettings
								.getState()
								.setSettings({ ephemeralTabs: value });
							this.app.workspace.trigger(
								"vertical-tabs:ephemeral-tabs",
								value
							);
							if (value) {
								this.app.workspace.trigger(
									"vertical-tabs:ephemeral-tabs-init"
								);
							}
						});
				});
		}

		new Setting(containerEl)
			.setName("Deduplicate tabs")
			.setDesc("Prevent opening the same note in multiple tabs.")
			.addToggle((toggle) => {
				toggle
					.setValue(this.plugin.settings.deduplicateTabs)
					.onChange(async (value) => {
						useSettings
							.getState()
							.setSettings({ deduplicateTabs: value });
						if (value) {
							this.app.workspace.trigger(
								"vertical-tabs:deduplicate-tabs"
							);
						}
					});
			});
	}
}
