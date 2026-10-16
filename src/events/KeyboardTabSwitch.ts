import ObsidianVerticalTabs from "src/main";
import { EVENTS } from "src/constants/Events";
import { VIEW_CUE_DELAY, useViewState } from "src/models/ViewState";
import { REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";
import { useSettings } from "src/models/PluginContext";

function showTabIndexViewCue(visible: boolean, doc: Document = document) {
	document
		.querySelector(".vertical-tabs")
		?.toggleClass("tab-index-view-cue", visible);
	doc.body.toggleClass("vt-tab-index-view-cue", visible);
}

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

	let viewCueWindow: Window | null = null;
	const resetTabIndexViewCue = () => {
		setCtrlKeyState(false);
		showTabIndexViewCue(false, viewCueWindow?.document);
		viewCueWindow?.removeEventListener("blur", resetTabIndexViewCue);
		viewCueWindow = null;
	};
	plugin.register(resetTabIndexViewCue);

	plugin.registerDomEvent(window, "keydown", (event) => {
		if (!useSettings.getState().enhancedKeyboardTabSwitch) return;

		if (
			(event.ctrlKey || event.metaKey) &&
			(event.key === "Control" ||
				event.key === "Meta" ||
				event.key === "ArrowRight" ||
				event.key === "ArrowLeft")
		) {
			if (!viewCueWindow) {
				viewCueWindow = activeWindow;
				viewCueWindow.addEventListener("blur", resetTabIndexViewCue);
			}
			setCtrlKeyState(true);

			if (event.key === "ArrowRight") increaseViewCueOffset();
			else if (event.key === "ArrowLeft") decreaseViewCueOffset();

			window.setTimeout(() => {
				if (useViewState.getState().hasCtrlKeyPressed) {
					showTabIndexViewCue(true, viewCueWindow?.document);
					scorllToViewCueFirstTab(plugin.app);
				}
			}, VIEW_CUE_DELAY);

			window.setTimeout(() => {
				const ref = document.querySelector(".vertical-tabs");
				if (ref?.hasClass("tab-index-view-cue")) {
					scorllToViewCueFirstTab(plugin.app);
				}
			}, REFRESH_TIMEOUT_LONG);
		}
	});

	plugin.registerDomEvent(window, "keyup", (event) => {
		if (event.key === "Control" || event.key === "Meta") {
			resetTabIndexViewCue();
		}
	});
}
