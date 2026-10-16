import ObsidianVerticalTabs from "src/main";
import { useSettings } from "src/models/PluginContext";

export function registerOpenVerticalTabsCommand(plugin: ObsidianVerticalTabs) {
	return [
		plugin.addCommand({
			id: "open",
			name: "Open",
			callback: () => {
				useSettings.getState().toggleBackgroundMode(plugin.app, false);
				void plugin.openVerticalTabs();
			},
		}),
	];
}
