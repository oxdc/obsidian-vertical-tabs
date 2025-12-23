import ObsidianVerticalTabs from "src/main";
import { EVENTS } from "src/constants/Events";
import { useSettings } from "src/models/PluginContext";
import { useViewState } from "src/models/ViewState";

export function registerZenModeCommands(plugin: ObsidianVerticalTabs) {
	const { toggleZenMode } = useSettings.getState();
	const { lockFocus } = useViewState.getState();
	return [
		plugin.addCommand({
			id: "toggle-zen-mode",
			name: "Toggle zen mode",
			callback: () => {
				toggleZenMode();
				lockFocus(plugin);
				plugin.app.workspace.trigger(EVENTS.UPDATE_TOGGLE);
			},
		}),
	];
}
