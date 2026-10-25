import type { App } from "obsidian";

const ACTIVE_TAB =
	"> .workspace-tabs > .workspace-tab-header-container " +
	"> .workspace-tab-header-container-inner " +
	"> .workspace-tab-header.is-active.obsidian-vertical-tabs-tab-header";

const HIDDEN_CLASS = "vt-horizontal-tabs-hidden";
const RIGHT_SIDEBAR_CLASS = "vt-horizontal-tabs-right-sidebar";

/** Update on workspace changes, without making CSS track the sidebar subtree. */
export function refreshHorizontalTabVisibility(app: App, enabled: boolean) {
	const workspace = app.workspace.containerEl;
	const leftActive =
		enabled &&
		!!workspace.querySelector(
			`:scope > .mod-sidedock.mod-left-split:not(.is-sidedock-collapsed) ${ACTIVE_TAB}`,
		);
	const rightActive =
		enabled &&
		!!workspace.querySelector(
			`:scope > .mod-sidedock.mod-right-split:not(.is-sidedock-collapsed) ${ACTIVE_TAB}`,
		);
	const pinnedDrawerActive =
		enabled &&
		(workspace.classList.contains("is-left-sidedock-open") ||
			workspace.classList.contains("is-right-sidedock-open")) &&
		!!workspace.querySelector(
			":scope > .workspace-drawer.is-pinned:is(.mod-left, .mod-right) " +
			".workspace-drawer-tab-options-list " +
			"> .workspace-tab-header.is-active.obsidian-vertical-tabs-tab-header",
		);

	workspace.classList.toggle(
		HIDDEN_CLASS,
		leftActive || rightActive || pinnedDrawerActive,
	);
	workspace.classList.toggle(RIGHT_SIDEBAR_CLASS, rightActive);
}

export function clearHorizontalTabVisibility(app: App) {
	app.workspace.containerEl.classList.remove(HIDDEN_CLASS, RIGHT_SIDEBAR_CLASS);
}

/** Watch sidebar controls only; Outline/editor mutations must not trigger refreshes. */
export function observeHorizontalTabVisibility(app: App, refresh: () => void) {
	const workspace = app.workspace.containerEl;
	const observer = new MutationObserver(refresh);
	const refreshTargets = () => {
		observer.disconnect();
		const attributes = { attributes: true, attributeFilter: ["class"] };
		observer.observe(workspace, attributes);
		workspace.querySelectorAll(":scope > .mod-sidedock").forEach((sidebar) => {
			observer.observe(sidebar, attributes);
		});
		workspace.querySelectorAll(
			":scope > .mod-sidedock > .workspace-tabs > .workspace-tab-header-container, " +
			":scope > .workspace-drawer .workspace-drawer-tab-options-list",
		).forEach((headers) => {
			observer.observe(headers, { ...attributes, childList: true, subtree: true });
		});
	};
	refreshTargets();
	return { refreshTargets, disconnect: () => observer.disconnect() };
}
