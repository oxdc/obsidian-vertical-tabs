import ObsidianVerticalTabs from "src/main";
import { debounce, Platform } from "obsidian";
import { updateOrientationLabel } from "src/services/Orientation";
import { EVENTS } from "src/constants/Events";
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";
import { useViewState } from "src/models/ViewState";

function registerOrientationEvents(plugin: ObsidianVerticalTabs) {
	if (Platform.isPhone) {
		updateOrientationLabel();
		plugin.registerDomEvent(window, "resize", updateOrientationLabel);
	}
}

function registerUILabelingEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;
	const { refreshToggleButtons } = useViewState.getState();
	const updateToggles = () =>
		window.setTimeout(() => refreshToggleButtons(plugin.app), REFRESH_TIMEOUT);
	plugin.registerEvent(workspace.on("resize", debounce(updateToggles)));
	plugin.registerEvent(workspace.on(EVENTS.UPDATE_TOGGLE, updateToggles));
}

export function registerReactiveUIEvents(plugin: ObsidianVerticalTabs) {
	registerOrientationEvents(plugin);
	registerUILabelingEvents(plugin);
}
