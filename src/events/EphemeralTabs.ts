import ObsidianVerticalTabs from "src/main";
import { EVENTS } from "src/constants/Events";
import {
	autoCloseOldEphemeralTabs,
	initEphemeralTabs,
	installTabHeaderHandlers,
	makeDblclickedFileNonEphemeral,
	makeLeafEphemeralOnEditorChange,
	makeTabNonEphemeralAutomatically,
	uninstallTabHeaderHandlers,
} from "src/services/EphemeralTabs";
import { useViewState } from "src/models/ViewState";
import { useSettings } from "src/models/PluginContext";

export function registerEphemeralTabsEvents(plugin: ObsidianVerticalTabs) {
	const app = plugin.app;
	const workspace = app.workspace;
	const { forgetNonephemeralTabs } = useViewState.getState();

	plugin.registerEvent(
		workspace.on(EVENTS.EPHEMERAL_TABS_INIT, (autoClose) => {
			initEphemeralTabs(app);
			installTabHeaderHandlers(app);
			if (autoClose) autoCloseOldEphemeralTabs(app);
		})
	);

	plugin.registerEvent(
		workspace.on(EVENTS.EPHEMERAL_TABS_DEINIT, () => {
			forgetNonephemeralTabs();
			uninstallTabHeaderHandlers(app);
		})
	);

	plugin.registerEvent(
		workspace.on(EVENTS.EPHEMERAL_TABS_UPDATE, (enabled, autoClose) => {
			if (enabled) {
				installTabHeaderHandlers(app);
				if (autoClose) autoCloseOldEphemeralTabs(app);
				makeTabNonEphemeralAutomatically(app);
			} else {
				uninstallTabHeaderHandlers(app);
			}
		})
	);

	plugin.registerEvent(
		workspace.on("editor-change", (_, info) => {
			if (useSettings.getState().ephemeralTabs) {
				makeLeafEphemeralOnEditorChange(info);
			}
		})
	);

	plugin.registerDomEvent(document, "dblclick", (event) => {
		makeDblclickedFileNonEphemeral(app, event);
	});
}
