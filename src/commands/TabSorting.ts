import ObsidianVerticalTabs from "src/main";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { sortStrategies } from "src/services/SortTabs";

export function registerTabSortingCommands(plugin: ObsidianVerticalTabs) {
	const { setSortStrategy } = tabCacheStore.getActions();
	return [
		plugin.addCommand({
			id: "disable-tab-sorting",
			name: "Disable tab sorting",
			callback: () => setSortStrategy(null),
		}),
		plugin.addCommand({
			id: "sort-tabs-title-a-to-z",
			name: "Sort tabs: Title name (A to Z)",
			callback: () => setSortStrategy(sortStrategies.titleAToZ),
		}),
		plugin.addCommand({
			id: "sort-tabs-title-z-to-a",
			name: "Sort tabs: Title name (Z to A)",
			callback: () => setSortStrategy(sortStrategies.titleZToA),
		}),
		plugin.addCommand({
			id: "sort-tabs-pinned-at-top",
			name: "Sort tabs: Pinned at top/left",
			callback: () => setSortStrategy(sortStrategies.pinnedAtTop),
		}),
		plugin.addCommand({
			id: "sort-tabs-pinned-at-bottom",
			name: "Sort tabs: Pinned at bottom/right",
			callback: () => setSortStrategy(sortStrategies.pinnedAtBottom),
		}),
		plugin.addCommand({
			id: "sort-tabs-recent-on-top",
			name: "Sort tabs: Recent on top/left",
			callback: () => setSortStrategy(sortStrategies.recentOnTop),
		}),
		plugin.addCommand({
			id: "sort-tabs-recent-on-bottom",
			name: "Sort tabs: Recent on bottom/right",
			callback: () => setSortStrategy(sortStrategies.recentOnBottom),
		}),
		plugin.addCommand({
			id: "sort-tabs-oldest-on-top",
			name: "Sort tabs: Oldest on top/left",
			callback: () => setSortStrategy(sortStrategies.oldestOnTop),
		}),
		plugin.addCommand({
			id: "sort-tabs-oldest-on-bottom",
			name: "Sort tabs: Oldest on bottom/right",
			callback: () => setSortStrategy(sortStrategies.oldestOnBottom),
		}),
	];
}
