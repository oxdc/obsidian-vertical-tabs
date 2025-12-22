import ObsidianVerticalTabs from "src/main";
import { EVENTS } from "src/constants/Events";
import { useSettings } from "src/models/PluginContext";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { useViewState } from "src/models/ViewState";
import {
	moveSelfToDefaultLocation,
	selfIsNotInTheSidebar,
} from "src/services/MoveTab";

export function autoRefresh(plugin: ObsidianVerticalTabs) {
	const app = plugin.app;
	const { refresh, sort } = tabCacheStore.getActions();
	const { setLatestActiveLeaf } = useViewState.getState();
	const { updateEphemeralTabs } = useSettings.getState();

	setLatestActiveLeaf(plugin);
	if (selfIsNotInTheSidebar(app)) {
		moveSelfToDefaultLocation(app);
	}
	if (useSettings.getState().deduplicateTabs) {
		app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
	}
	setTimeout(() => {
		updateEphemeralTabs(app);
		refresh(app);
		sort();
	});
}
