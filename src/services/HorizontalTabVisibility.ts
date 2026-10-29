import { App, Platform, WorkspaceLeaf, WorkspaceMobileDrawer, WorkspaceSidedock } from "obsidian";
import { VERTICAL_TABS_VIEW } from "src/views/VerticalTabsView";

type Sidebar = WorkspaceSidedock | WorkspaceMobileDrawer;

function activeIn(leaf: WorkspaceLeaf, sidebar: Sidebar) {
	return leaf.getRoot() === sidebar && leaf.parent.children[leaf.parent.currentTab] === leaf;
}

function isSelfActiveIn(app: App, sidebar: Sidebar | null) {
	if (sidebar === null || sidebar.collapsed) return false; // sidebar can be null on layout reload
	if (Platform.isMobile && (sidebar as WorkspaceMobileDrawer).isPinned !== true) return false;
	return app.workspace.getLeavesOfType(VERTICAL_TABS_VIEW).some((leaf) => activeIn(leaf, sidebar));
}

export function refreshSelfVisibilityLabels(app: App, enabled: boolean) {
	const workspace = app.workspace;
	const visibleInLeftSidebar = enabled && isSelfActiveIn(app, workspace.leftSplit);
	const visibleInRightSidebar = enabled && isSelfActiveIn(app, workspace.rightSplit);
	workspace.containerEl.toggleClass("vt-horizontal-tabs-hidden", visibleInLeftSidebar || visibleInRightSidebar);
	workspace.containerEl.toggleClass("vt-in-right-sidebar", !Platform.isMobile && visibleInRightSidebar);
}

export function clearSelfVisibilityLabels(app: App) {
	app.workspace.containerEl.removeClass("vt-horizontal-tabs-hidden", "vt-in-right-sidebar");
}
