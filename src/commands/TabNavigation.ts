import ObsidianVerticalTabs from "src/main";
import { useSettings } from "src/models/PluginContext";
import { useViewState } from "src/models/ViewState";
import { makeLeafNonEphemeral } from "src/services/EphemeralTabs";
import { iterateRootOrFloatingLeaves } from "src/services/GetTabs";
import { deduplicateExistingTabs } from "src/services/DeduplicateTab";

export function registerTabNavigationCommands(plugin: ObsidianVerticalTabs) {
	const app = plugin.app;
	const { uncollapseActiveGroup } = useViewState.getState();
	return [
		plugin.addCommand({
			id: "set-all-tabs-nonephemeral",
			name: "Set all tabs non-ephemeral",
			callback: () => {
				if (!useSettings.getState().ephemeralTabs) return;
				iterateRootOrFloatingLeaves(app, (leaf) =>
					makeLeafNonEphemeral(leaf)
				);
			},
		}),
		plugin.addCommand({
			id: "deduplicate-existing-tabs",
			name: "Deduplicate all existing tabs",
			callback: () => {
				deduplicateExistingTabs(app, true);
				uncollapseActiveGroup(app);
			},
		}),
	];
}
