import { App, Platform, WorkspaceMobileDrawer, WorkspaceSidedock } from "obsidian";
import { VERTICAL_TABS_VIEW } from "src/views/VerticalTabsView";

const HIDDEN_CLASS = "vt-horizontal-tabs-hidden";
const RIGHT_SIDEBAR_CLASS = "vt-horizontal-tabs-right-sidebar";

function isVerticalTabsActive(app: App, sidebar: WorkspaceSidedock | WorkspaceMobileDrawer) {
	if (sidebar.collapsed) return false;
	if (Platform.isMobile && (sidebar as WorkspaceMobileDrawer).isPinned !== true) return false;
	return app.workspace.getLeavesOfType(VERTICAL_TABS_VIEW).some((leaf) =>
		leaf.getRoot() === sidebar && leaf.parent.children[leaf.parent.currentTab] === leaf
	);
}

export function refreshHorizontalTabVisibility(app: App, enabled: boolean) {
	const { workspace } = app;
	const leftVisible = enabled && isVerticalTabsActive(app, workspace.leftSplit);
	const rightVisible = enabled && isVerticalTabsActive(app, workspace.rightSplit);
	workspace.containerEl.toggleClass(HIDDEN_CLASS, leftVisible || rightVisible);
	workspace.containerEl.toggleClass(RIGHT_SIDEBAR_CLASS, !Platform.isMobile && rightVisible);
}

export function clearHorizontalTabVisibility(app: App) {
	app.workspace.containerEl.removeClass(HIDDEN_CLASS, RIGHT_SIDEBAR_CLASS);
}
