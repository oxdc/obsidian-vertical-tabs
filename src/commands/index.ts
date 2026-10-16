import ObsidianVerticalTabs from "src/main";
import { registerOpenVerticalTabsCommand } from "./Base";
import { registerZenModeCommands } from "./ZenMode";
import { registerTabZoomCommands } from "./TabZoom";
import { registerGroupViewCommands } from "./GroupView";
import { registerBookmarkCommands } from "./Bookmark";
import { registerTabNavigationCommands } from "./TabNavigation";
import { registerTabSortingCommands } from "./TabSorting";

export function registerCommands(plugin: ObsidianVerticalTabs) {
	return [
		...registerOpenVerticalTabsCommand(plugin),
		...registerZenModeCommands(plugin),
		...registerTabZoomCommands(plugin),
		...registerGroupViewCommands(plugin),
		...registerBookmarkCommands(plugin),
		...registerTabNavigationCommands(plugin),
		...registerTabSortingCommands(plugin),
	];
}
