import ObsidianVerticalTabs from "src/main";
import { EVENTS } from "src/constants/Events";
import { deduplicateExistingTabs } from "src/services/DeduplicateTab";
import { useViewState } from "src/models/ViewState";

export function registerTabDeduplicationEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;
	const { uncollapseActiveGroup } = useViewState.getState();

	plugin.registerEvent(
		workspace.on(EVENTS.DEDUPLICATE_TABS, () => {
			deduplicateExistingTabs(plugin.app);
			uncollapseActiveGroup(plugin.app);
		})
	);
}
