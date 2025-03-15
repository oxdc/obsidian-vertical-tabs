import { App } from "obsidian";
import { VERTICAL_TABS_VIEW } from "src/views/VerticalTabsView";

export function isSelfVisible(app: App): boolean {
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VERTICAL_TABS_VIEW).first();
	if (!self) return false;
	return self.isVisible();
}
