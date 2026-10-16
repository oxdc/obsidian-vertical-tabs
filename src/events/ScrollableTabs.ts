import ObsidianVerticalTabs from "src/main";
import { MarkdownView } from "obsidian";
import { createActiveTabScroller } from "src/services/ScrollableTabs";
import { useViewState } from "src/models/ViewState";

export function registerScrollableTabsEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;
	const scroller = createActiveTabScroller();
	plugin.register(scroller.cancel);

	plugin.registerEvent(
		workspace.on("active-leaf-change", (leaf) => {
			scroller.scrollToActiveTab(leaf);
			useViewState.getState().markScrollableState(null);
		})
	);

	plugin.registerEvent(
		workspace.on("editor-change", (_, info) => {
			if (
				info instanceof MarkdownView &&
				useViewState.getState().scrollableState === info.leaf.id
			) {
				scroller.scrollToActiveTab(info.leaf);
			}
		})
	);
}
