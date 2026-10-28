import ObsidianVerticalTabs from "src/main";
import { debounce, Platform } from "obsidian";
import { updateOrientationLabel } from "src/services/Orientation";
import { EVENTS } from "src/constants/Events";
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";
import { useViewState } from "src/models/ViewState";
import { refreshExtraHeaderButtons } from "src/services/ExtraHeaderButtons";
import {
	clearHorizontalTabVisibility,
	refreshHorizontalTabVisibility,
} from "src/services/HorizontalTabVisibility";

function registerHorizontalTabVisibilityEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;
	const refresh = () =>
		refreshHorizontalTabVisibility(plugin.app, plugin.settings.autoHideHorizontalTabs);
	// Sidedock resize events arrive after the collapse animation finishes.
	const observer = new MutationObserver(refresh);
	const layoutChanged = () => {
		observer.disconnect();
		for (const sidebar of [workspace.leftSplit, workspace.rightSplit]) {
			observer.observe(sidebar.containerEl, {
				attributes: true,
				attributeFilter: ["class"],
			});
		}
		refresh();
	};
	plugin.registerEvent(workspace.on("layout-change", layoutChanged));
	plugin.registerEvent(workspace.on("active-leaf-change", refresh));
	plugin.registerEvent(workspace.on("resize", refresh));
	workspace.onLayoutReady(layoutChanged);
	plugin.register(() => {
		observer.disconnect();
		clearHorizontalTabVisibility(plugin.app);
	});
}

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

function registerExtraHeaderButtonEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;
	const refresh = debounce(
		() => refreshExtraHeaderButtons(plugin.app, plugin),
		REFRESH_TIMEOUT
	);
	plugin.registerEvent(workspace.on("layout-change", refresh));
}

export function registerReactiveUIEvents(plugin: ObsidianVerticalTabs) {
	registerHorizontalTabVisibilityEvents(plugin);
	registerOrientationEvents(plugin);
	registerUILabelingEvents(plugin);
	registerExtraHeaderButtonEvents(plugin);
}
