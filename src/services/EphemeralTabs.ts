import { App, MarkdownFileInfo, MarkdownView, WorkspaceLeaf } from "obsidian";

export function makeLeafNonEphemeralByID(app: App, leafID: string) {
	const leaf = app.workspace.getLeafById(leafID);
	if (!leaf) return;
	makeLeafNonEphemeral(leaf);
}

export function initNonEphemeralTabs(app: App, leafIDs: string[]) {
	leafIDs.forEach((leafID) => {
		makeLeafNonEphemeralByID(app, leafID);
	});
}

export function makeLeafNonEphemeral(leaf: WorkspaceLeaf) {
	leaf.isEphemeral = false;
	leaf.tabHeaderEl?.toggleClass("vt-non-ephemeral", true);
	leaf.trigger("ephemeral-toggle", false);
}

export function makeLeafEphemeralOnEditorChange(
	info: MarkdownView | MarkdownFileInfo
) {
	if (info instanceof MarkdownView) {
		makeLeafNonEphemeral(info.leaf);
	}
}

export function installTabHeaderHandlerForLeaf(leaf: WorkspaceLeaf) {
	if (leaf.isEphemeral !== undefined) return;
	leaf.isEphemeral = true;
	leaf.trigger("ephemeral-toggle", true);
	if (!leaf.tabHeaderEl) return;
	leaf.tabHeaderEl.ondblclick = (event: MouseEvent) => {
		makeLeafNonEphemeral(leaf);
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
