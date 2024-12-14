import { App, WorkspaceLeaf } from "obsidian";
import { Identifier } from "src/models/VTWorkspace";

export function isHoverEditorEnabled(app: App): boolean {
	return app.plugins.enabledPlugins.has("obsidian-hover-editor");
}

export function getHoverEditorInstance(app: App) {
	return isHoverEditorEnabled(app)
		? app.plugins.plugins["obsidian-hover-editor"]
		: null;
}

export function getLeavesControlledByHoverEditor(app: App): WorkspaceLeaf[] {
	const leaves: WorkspaceLeaf[] = [];
	const instance = getHoverEditorInstance(app);
	if (!instance) return leaves;
	instance.activePopovers.forEach((popover) => {
		if (!popover.rootSplit) return;
		app.workspace.iterateLeaves(popover.rootSplit, (leaf) => {
			leaves.push(leaf);
		});
	});
	return leaves;
}

export function getLeaveIDsControlledByHoverEditor(app: App): Identifier[] {
	return getLeavesControlledByHoverEditor(app).map((leaf) => leaf.id);
}

export function iterateLeavesControlledByHoverEditor(
  app: App,
  callback: (leaf: WorkspaceLeaf) => void
) {
  const instance = getHoverEditorInstance(app);
  if (!instance) return;
  instance.activePopovers.forEach((popover) => {
    if (!popover.rootSplit) return;
    app.workspace.iterateLeaves(popover.rootSplit, callback);
  });
}