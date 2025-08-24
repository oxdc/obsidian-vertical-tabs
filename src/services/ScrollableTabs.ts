import { debounce } from "obsidian";
import { REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";

export const setScrollableTabsMinWidth = debounce((value: number) => {
	document.body.style.setProperty(
		"--vt-scrollable-tabs-min-width",
		`${value}px`
	);
}, REFRESH_TIMEOUT_LONG);
