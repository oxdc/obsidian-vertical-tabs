import {
	App,
	MarkdownFileInfo,
	MarkdownView,
	WorkspaceLeaf,
	WorkspaceParent,
} from "obsidian";
import { iterateRootOrFloatingLeaves, iterateSidebarLeaves } from "./GetTabs";
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
	leaf.tabHeaderEl?.toggleClass("vt-non-ephemeral", false);
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
	iterateRootOrFloatingLeaves(app, (leaf) => {
		installTabHeaderHandlerForLeaf(leaf);
	});
	iterateSidebarLeaves(app, (leaf) => {
		makeLeafNonEphemeral(leaf);
	});
}

export function uninstallTabHeaderHandlers(app: App) {
	iterateRootOrFloatingLeaves(app, (leaf) => {
		uninstallTabHeaderHandlerForLeaf(leaf);
	});
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

export function mergeHistory(from: WorkspaceLeaf[], to: WorkspaceLeaf) {
	const mergedHistory = from.reduce((acc, leaf) => {
		return [
			...acc,
			...leaf.history.backHistory,
			leaf.getHistoryState(),
			...leaf.history.forwardHistory.slice().reverse(),
		];
	}, []);
	to.history.backHistory = [...mergedHistory, ...to.history.backHistory];
}

export function autoCloseOldEphemeralTabsForGroup(group: WorkspaceParent) {
	const ephemeralTabs = group.children.filter((child) => child.isEphemeral);
	if (ephemeralTabs.length <= 1) return;
	const activeTimes = ephemeralTabs.map((tab) => tab.activeTime);
	const earliestActiveTime = Math.min(...activeTimes);
	const latestActiveTime = Math.max(...activeTimes);
	// If both are non-positive, all tabs are new or not fully loaded.
	// We sort the tabs by their index, assuming that the last tab is the most recent one.
	if (latestActiveTime <= 0 && earliestActiveTime <= 0) {
		const lastEphemeralTab = ephemeralTabs.pop();
		if (!lastEphemeralTab) return;
		mergeHistory(ephemeralTabs, lastEphemeralTab);
		ephemeralTabs.forEach((tab) => tab.detach());
	} else {
		// If we have active times, we sort the tabs as follows:
		// First, we assume the tabs with non-positive active time are new, i.e., the latest active ones.
		// Second, we sort the tabs by their active time, with the latest active tab being the last one.
		// Third, for tabs with the same active time, we sort them by their index.
		const sortedEphemeralTabs = ephemeralTabs.sort((a, b) => {
			if (a.activeTime <= 0) return 1;
			if (b.activeTime <= 0) return -1;
			if (a.activeTime === b.activeTime) {
				return group.children.indexOf(a) - group.children.indexOf(b);
			}
			return a.activeTime - b.activeTime;
		});
		const lastEphemeralTab = sortedEphemeralTabs.pop();
		if (!lastEphemeralTab) return;
		mergeHistory(sortedEphemeralTabs, lastEphemeralTab);
		sortedEphemeralTabs.forEach((tab) => tab.detach());
	}
}

export function autoCloseOldEphemeralTabs(app: App) {
	const groups = new Set<WorkspaceParent>();
	iterateRootOrFloatingLeaves(app, (leaf) => groups.add(leaf.parent));
	groups.forEach((group) => autoCloseOldEphemeralTabsForGroup(group));
}
