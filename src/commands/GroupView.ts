import ObsidianVerticalTabs from "src/main";
import { useViewState } from "src/models/ViewState";
import { GroupViewType } from "src/models/VTGroupView";

export function registerGroupViewCommands(plugin: ObsidianVerticalTabs) {
	const { setGroupViewTypeForCurrentGroup: setGroupView } =
		useViewState.getState();
	return [
		plugin.addCommand({
			id: "set-current-group-default-view",
			name: "Set current group as default view",
			callback: () => setGroupView(GroupViewType.Default),
		}),
		plugin.addCommand({
			id: "set-current-group-continuous-view",
			name: "Set current group as continuous view",
			callback: () => setGroupView(GroupViewType.ContinuousView),
		}),
		plugin.addCommand({
			id: "set-current-group-column-view",
			name: "Set current group as column view",
			callback: () => setGroupView(GroupViewType.ColumnView),
		}),
		plugin.addCommand({
			id: "set-current-group-mission-control-view",
			name: "Set current group as mission control view",
			callback: () => setGroupView(GroupViewType.MissionControlView),
		}),
	];
}
