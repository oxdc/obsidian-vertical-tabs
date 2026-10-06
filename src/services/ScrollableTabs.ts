import { debounce, WorkspaceLeaf } from "obsidian";
import {
	REFRESH_TIMEOUT_LONG,
	REFRESH_TIMEOUT_LONGER,
} from "src/constants/Timeouts";
import { useSettings } from "src/models/PluginContext";

export const setScrollableTabsMinWidth = debounce((value: number) => {
	activeDocument.body.style.setProperty(
		"--vt-scrollable-tabs-min-width",
		`${value}px`
	);
}, REFRESH_TIMEOUT_LONG);

export const createActiveTabScroller = () => {
	let pendingWindow: Window | null = null;
	let timeout: number | null = null;
	let frame: number | null = null;

	const cancel = () => {
		if (timeout !== null) pendingWindow?.clearTimeout(timeout);
		if (frame !== null) pendingWindow?.cancelAnimationFrame(frame);
		timeout = null;
		frame = null;
		pendingWindow = null;
	};

	const scrollToActiveTab = (leaf: WorkspaceLeaf | null) => {
		cancel();
		if (!leaf || !leaf.parent || leaf.parent.isStacked) return;
		if (!useSettings.getState().scrollableTabs) return;
		const ownerWindow = leaf.tabHeaderEl.ownerDocument.defaultView;
		if (!ownerWindow) return;
		pendingWindow = ownerWindow;
		// Let tab activation and CSS transitions finish before measuring.
		timeout = ownerWindow.setTimeout(() => {
			timeout = null;
			frame = ownerWindow.requestAnimationFrame(() => {
				frame = null;
				pendingWindow = null;
				if (
					!useSettings.getState().scrollableTabs ||
					!leaf.parent ||
					leaf.parent.isStacked
				) {
					return;
				}
				const header = leaf.tabHeaderEl;
				const container = leaf.parent.tabHeaderContainerEl;
				if (!header.isConnected || !container?.isConnected) return;

				// Read each rectangle once, before making any scroll changes.
				const headerRect = header.getBoundingClientRect();
				const containerRect = container.getBoundingClientRect();
				if (!headerRect.width || !headerRect.height) return;
				if (!containerRect.width || !containerRect.height) return;
				const isVisible =
					headerRect.left >= containerRect.left &&
					headerRect.right <= containerRect.right &&
					headerRect.top >= containerRect.top &&
					headerRect.bottom <= containerRect.bottom;
				if (isVisible) return;
				header.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
					inline: "nearest",
				});
			});
		}, REFRESH_TIMEOUT_LONGER);
	};

	return { scrollToActiveTab, cancel };
};
