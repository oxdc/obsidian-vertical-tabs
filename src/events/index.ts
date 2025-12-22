import ObsidianVerticalTabs from "src/main";
import { registerReactiveUIEvents } from "./ReactiveUI";
import { registerVerticalTabsEvents } from "./VerticalTabs";
import { registerScrollableTabsEvents } from "./ScrollableTabs";
import { registerKeyboardTabSwitchEvents } from "./KeyboardTabSwitch";
import { registerFileMenuEvents } from "./FileMenu";
import { registerGroupViewEvents } from "./GroupView";
import { registerEphemeralTabsEvents } from "./EphemeralTabs";
import { registerTabDeduplicationEvents } from "./TabDeduplication";

export function registerEvents(plugin: ObsidianVerticalTabs) {
	registerReactiveUIEvents(plugin);
	registerVerticalTabsEvents(plugin);
	registerScrollableTabsEvents(plugin);
	registerKeyboardTabSwitchEvents(plugin);
	registerFileMenuEvents(plugin);
	registerGroupViewEvents(plugin);
	registerEphemeralTabsEvents(plugin);
	registerTabDeduplicationEvents(plugin);
}
