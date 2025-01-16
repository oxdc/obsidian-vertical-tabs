import { App, Platform, WorkspaceMobileDrawer } from "obsidian";
import { VIEW_TYPE } from "src/navigation";

export function getDrawer(app: App): WorkspaceMobileDrawer | null {
	if (!Platform.isMobile) return null;
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VIEW_TYPE).first();
	if (!self) return null;
	const parent = self.parent;
	return parent as WorkspaceMobileDrawer | null;
}

export function pinDrawer(app: App) {
	const drawer = getDrawer(app);
	if (drawer) drawer.collapsed = true;
}

export function unpinDrawer(app: App) {
	const drawer = getDrawer(app);
	if (drawer) drawer.collapsed = false;
}
