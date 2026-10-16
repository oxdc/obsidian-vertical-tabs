import ObsidianVerticalTabs from "src/main";
import { useViewState } from "src/models/ViewState";

export function registerGroupViewEvents(plugin: ObsidianVerticalTabs) {
	const { exitMissionControlForCurrentGroup } = useViewState.getState();

	plugin.registerDomEvent(window, "keydown", (event) => {
		if (event.key === "Escape") {
			exitMissionControlForCurrentGroup();
		}
	});
}
