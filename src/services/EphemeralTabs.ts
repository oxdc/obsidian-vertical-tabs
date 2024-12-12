import { App, MarkdownFileInfo, MarkdownView, WorkspaceLeaf } from "obsidian";
import { iterateRootOrFloatingLeaves } from "./GetTabs";
import { useViewState } from "src/models/ViewState";
import { useSettings } from "src/models/PluginContext";
import { Identifier } from "src/models/VTWorkspace";

export function makeLeafNonEphemeralByID(app: App, leafID: string) {
	const leaf = app.workspace.getLeafById(leafID);
	if (!leaf) return;
	makeLeafNonEphemeral(leaf);
}

export function makeTabsNonEphemeralByList(app: App, leafIDs: string[]) {
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
	useViewState.getState().forgetNonephemeralTabs();
}

export function makeTabNonEphemeralAutomatically(app: App) {
	const processedGroups = new Set<Identifier>();
	iterateRootOrFloatingLeaves(app, (leaf) => {
		const group = leaf.parent;
		const groupID = group.id;
		if (processedGroups.has(groupID)) return;
		processedGroups.add(groupID);
		// We keep the latest active tab ephemeral and make the rest non-ephemeral
		const children = group.children;
		const activeTimes = children.map((child) => child.activeTime);
		const latestActiveTime = Math.max(...activeTimes);
		if (latestActiveTime > 0) {
			// We have that information
			children.forEach((child) => {
				if (child.activeTime !== latestActiveTime) {
					makeLeafNonEphemeral(child);
				}
			});
		} else {
			// Otherwise, we keep the last tab ephemeral
			children.slice(0, -1).forEach((child) => {
				makeLeafNonEphemeral(child);
			});
		}
	});
}

export function initEphemeralTabs(app: App) {
	if (!useSettings.getState().ephemeralTabs) return;
	// We try to recover the saved state
	const nonEphemeralTabs = useViewState.getState().nonEphemeralTabs;
	if (nonEphemeralTabs.length > 0) {
		makeTabsNonEphemeralByList(app, nonEphemeralTabs);
	} else {
		// if we dont have that information, use a heuristic
		makeTabNonEphemeralAutomatically(app);
	}
	installTabHeaderHandlers(app);
}
