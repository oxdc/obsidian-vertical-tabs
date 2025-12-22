import ObsidianVerticalTabs from "src/main";
import { EVENTS } from "src/constants/Events";
import { VIEW_CUE_DELAY, useViewState } from "src/models/ViewState";
import { REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";
import { useSettings } from "src/models/PluginContext";

export function registerKeyboardTabSwitchEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;
	const {
		modifyViewCueCallback,
		resetViewCueCallback,
		setCtrlKeyState,
		increaseViewCueOffset,
		decreaseViewCueOffset,
		scorllToViewCueFirstTab,
	} = useViewState.getState();

	plugin.registerEvent(
		workspace.on(EVENTS.ENHANCED_KEYBOARD_TAB_SWITCH, () => {
			modifyViewCueCallback(plugin.app);
		})
	);

	plugin.registerEvent(
		workspace.on(EVENTS.RESET_KEYBOARD_TAB_SWITCH, () => {
			resetViewCueCallback(plugin.app);
		})
	);

	plugin.registerDomEvent(window, "keydown", (event) => {
		if (!useSettings.getState().enhancedKeyboardTabSwitch) return;
		const ref = document.querySelector(".vertical-tabs");

		if (
			(event.ctrlKey || event.metaKey) &&
			(event.key === "Control" ||
				event.key === "Meta" ||
				event.key === "ArrowRight" ||
				event.key === "ArrowLeft")
		) {
			setCtrlKeyState(true);

			if (event.key === "ArrowRight") increaseViewCueOffset();
			else if (event.key === "ArrowLeft") decreaseViewCueOffset();

			setTimeout(() => {
				if (useViewState.getState().hasCtrlKeyPressed) {
					ref?.toggleClass("tab-index-view-cue", true);
					document.body.toggleClass("vt-tab-index-view-cue", true);
					scorllToViewCueFirstTab(plugin.app);
				}
			}, VIEW_CUE_DELAY);

			setTimeout(() => {
				if (ref?.hasClass("tab-index-view-cue")) {
					scorllToViewCueFirstTab(plugin.app);
				}
			}, REFRESH_TIMEOUT_LONG);
		}
	});

	plugin.registerDomEvent(window, "keyup", (event) => {
		const ref = document.querySelector(".vertical-tabs");

		if (event.key === "Control" || event.key === "Meta") {
			setCtrlKeyState(false);
			ref?.toggleClass("tab-index-view-cue", false);
			document.body.toggleClass("vt-tab-index-view-cue", false);
		}
	});
}
