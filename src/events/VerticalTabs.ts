import { EVENTS } from "src/constants/Events";
import ObsidianVerticalTabs from "src/main";
import { useSettings } from "src/models/PluginContext";
import { useViewState } from "src/models/ViewState";
import { autoRefresh } from "src/services/Refresh";
import { isSelfVisible } from "src/services/Visibility";

export function registerVerticalTabsEvents(plugin: ObsidianVerticalTabs) {
	const app = plugin.app;
	const workspace = app.workspace;
	const { uncollapseActiveGroup } = useViewState.getState();

	plugin.registerEvent(
		workspace.on("layout-change", () => autoRefresh(plugin))
	);

	plugin.registerEvent(
		workspace.on("active-leaf-change", () => {
			useViewState.getState().setLatestActiveLeaf(plugin);
			window.setTimeout(() => {
				useSettings.getState().updateEphemeralTabs(app);
			});
		})
	);

	plugin.registerEvent(
		workspace.on("file-open", () => {
			useViewState.getState().bumpActiveFileTick();
		})
	);
	plugin.registerEvent(
		workspace.on(EVENTS.REQUEST_ICON_REFRESH, () => {
			useViewState.getState().bumpActiveFileTick();
		})
	);

	plugin.registerEvent(
		workspace.on("active-leaf-change", () => {
			if (
				useSettings.getState().autoUncollapseGroup &&
				isSelfVisible(app)
			) {
				uncollapseActiveGroup(app);
			}
		})
	);
}
