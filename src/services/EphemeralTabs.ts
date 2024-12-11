import { App, WorkspaceLeaf } from "obsidian";

export function installTabHeaderHandlerForLeaf(leaf: WorkspaceLeaf) {
	if (leaf.isEphemeral !== undefined) return;
	leaf.isEphemeral = true;
	if (!leaf.tabHeaderEl) return;
	leaf.tabHeaderEl.ondblclick = (event: MouseEvent) => {
		leaf.isEphemeral = false;
		leaf.tabHeaderEl?.toggleClass("vt-non-ephemeral", true);
		leaf.trigger("ephemeral-toggle");
		event.stopPropagation();
	};
}

export function uninstallTabHeaderHandlerForLeaf(leaf: WorkspaceLeaf) {
	leaf.isEphemeral = undefined;
	if (!leaf.tabHeaderEl) return;
	leaf.tabHeaderEl.ondblclick = null;
}

export function installTabHeaderHandlers(app: App) {
	app.workspace.iterateRootLeaves((leaf) => {
		installTabHeaderHandlerForLeaf(leaf);
	});
}

export function uninstallTabHeaderHandlers(app: App) {
	app.workspace.iterateRootLeaves((leaf) => {
		uninstallTabHeaderHandlerForLeaf(leaf);
	});
}
