import ObsidianVerticalTabs from "src/main";
import { useSettings } from "src/models/PluginContext";

export function registerOpenVerticalTabsCommand(plugin: ObsidianVerticalTabs) {
	return [
		plugin.addCommand({
			id: "open-vertical-tabs",
			name: "Open vertical tabs",
			callback: () => {
				plugin.openVerticalTabs();
				useSettings.getState().toggleBackgroundMode(plugin.app, false);
			},
		}),
	];
}
