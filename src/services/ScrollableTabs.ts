import { debounce, WorkspaceLeaf } from "obsidian";
import {
	REFRESH_TIMEOUT_LONG,
	REFRESH_TIMEOUT_LONGER,
} from "src/constants/Timeouts";
import { useSettings } from "src/models/PluginContext";

export const setScrollableTabsMinWidth = debounce((value: number) => {
	document.body.style.setProperty(
		"--vt-scrollable-tabs-min-width",
		`${value}px`
	);
}, REFRESH_TIMEOUT_LONG);

export const scrollToActiveTab = (leaf: WorkspaceLeaf | null) => {
	if (!leaf || !useSettings.getState().scrollableTabs) return;
	setTimeout(
		() =>
			leaf.tabHeaderEl.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "center",
			}),
		REFRESH_TIMEOUT_LONGER // Longer timeout to avoid interference with CSS transitions
	);
};
