import { App, Platform, WorkspaceMobileDrawer } from "obsidian";
import { VERTICAL_TABS_VIEW } from "src/views/VerticalTabsView";

const DRAWER_ANIMATION_TIMEOUT = 500;

export interface MobileDrawers {
	contained: WorkspaceMobileDrawer | null;
	other: WorkspaceMobileDrawer | null;
}

const NULL_MOBILE_DRAWERS: MobileDrawers = {
	contained: null,
	other: null,
};

export function getDrawer(app: App): MobileDrawers {
	if (!Platform.isMobile) return NULL_MOBILE_DRAWERS;
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VERTICAL_TABS_VIEW).first();
	if (!self) return NULL_MOBILE_DRAWERS;
	const { leftSplit, rightSplit } = workspace;
	const parent = self.parent;
	if (parent === leftSplit) {
		return {
			contained: leftSplit as WorkspaceMobileDrawer,
			other: rightSplit as WorkspaceMobileDrawer,
		};
	} else if (parent === rightSplit) {
		return {
			contained: rightSplit as WorkspaceMobileDrawer,
			other: leftSplit as WorkspaceMobileDrawer,
		};
	} else {
		return NULL_MOBILE_DRAWERS;
	}
}

export function pinDrawer(app: App) {
	const drawer = getDrawer(app);
	if (drawer.contained) drawer.contained.collapsed = true;
	drawer.other?.containerEl.toggleClass("is-hidden", true);
}

export function unpinDrawer(app: App) {
	const drawer = getDrawer(app);
	if (drawer.contained) drawer.contained.collapsed = false;
	setTimeout(() => {
		drawer.contained?.containerEl.toggleClass("is-hidden", false);
		drawer.other?.containerEl.toggleClass("is-hidden", false);
	}, DRAWER_ANIMATION_TIMEOUT);
}
