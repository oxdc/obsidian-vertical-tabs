import {
	App,
	MarkdownFileInfo,
	MarkdownView,
	QuickSwitcherItem,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
	WorkspaceParent,
} from "obsidian";
import {
	getOpenFileOfLeaf,
	iterateRootOrFloatingLeaves,
	iterateSidebarLeaves,
} from "./GetTabs";
import { useViewState } from "src/models/ViewState";
import { useSettings } from "src/models/PluginContext";
import { Identifier } from "src/models/VTWorkspace";
import { iterateLeavesControlledByHoverEditor } from "./HoverEditorTabs";
import { REFRESH_TIMEOUT_LONG } from "src/models/TabCache";
import { safeDetach } from "./CloseTabs";

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
	iterateLeavesControlledByHoverEditor(app, (leaf) => {
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
		const children = group.children;
		// If there are only one ephemeral tab, we skip this group
		const count = children.filter((child) => child.isEphemeral);
		if (count.length <= 1) return;
		// Otherwise, we keep the latest active tab ephemeral and make the rest non-ephemeral
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
	const { ephemeralTabs, autoCloseEphemeralTabs } = useSettings.getState();
	if (!ephemeralTabs) return;
	// We try to recover the saved state
	const nonEphemeralTabs = useViewState.getState().nonEphemeralTabs;
	if (nonEphemeralTabs.length > 0) {
		// If auto close is enabled, we prefer only one ephemeral tab per group
		if (autoCloseEphemeralTabs) makeTabNonEphemeralAutomatically(app);
		// Then we recover the saved state
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
		ephemeralTabs.forEach((tab) => safeDetach(tab));
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
		sortedEphemeralTabs.forEach((tab) => safeDetach(tab));
	}
}

export function autoCloseOldEphemeralTabs(app: App) {
	const groups = new Set<WorkspaceParent>();
	iterateRootOrFloatingLeaves(app, (leaf) => groups.add(leaf.parent));
	groups.forEach((group) => autoCloseOldEphemeralTabsForGroup(group));
}

export function makeTheLatestFileNonEphemeral(
	app: App,
	file: TAbstractFile | null
) {
	if (!file) return;
	if (!(file instanceof TFile)) return;
	let activeTime = 0;
	let targetLeaf: WorkspaceLeaf | null = null;
	app.workspace.iterateAllLeaves((leaf) => {
		const leafFile = getOpenFileOfLeaf(app, leaf);
		if (!leafFile || leafFile.path !== file.path) return;
		if (leaf.activeTime >= activeTime) {
			activeTime = leaf.activeTime;
			targetLeaf = leaf;
		}
	});
	if (targetLeaf) {
		makeLeafNonEphemeral(targetLeaf);
	}
}

export function makeDblclickedFileNonEphemeral(app: App, event: MouseEvent) {
	const target = event.target as HTMLElement;
	const fileTitleEl = target.matchParent(".nav-file-title");
	const path = fileTitleEl?.getAttribute("data-path");
	if (!path) return;
	const file = app.vault.getAbstractFileByPath(path);
	makeTheLatestFileNonEphemeral(app, file);
}

export function makeQuickSwitcherFileNonEphemeral(
	app: App,
	item: QuickSwitcherItem
) {
	setTimeout(() => {
		if (item.type === "file" && item.file) {
			makeTheLatestFileNonEphemeral(app, item.file);
		}
	}, REFRESH_TIMEOUT_LONG);
}
