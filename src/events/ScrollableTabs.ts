import ObsidianVerticalTabs from "src/main";
import { MarkdownView } from "obsidian";
import { scrollToActiveTab } from "src/services/ScrollableTabs";

export function registerScrollableTabsEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;

	plugin.registerEvent(
		workspace.on("active-leaf-change", (leaf) => scrollToActiveTab(leaf))
	);

	plugin.registerEvent(
		workspace.on("editor-change", (_, info) => {
			if (info instanceof MarkdownView) {
				scrollToActiveTab(info.leaf);
			}
		})
	);
}
