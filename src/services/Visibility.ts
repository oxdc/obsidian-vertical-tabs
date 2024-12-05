import { App } from "obsidian";
import { VIEW_TYPE } from "src/navigation";

export function isSelfVisible(app: App): boolean {
	const workspace = app.workspace;
	const self = workspace.getLeavesOfType(VIEW_TYPE).first();
	if (!self) return false;
	return self.isVisible();
}
