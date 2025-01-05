import { App, FileView, TFile, WorkspaceLeaf } from "obsidian";
import { loadDeferredLeaf } from "./LoadDeferredLeaf";
import { useSettings } from "src/models/PluginContext";
import {
	getLeaveIDsControlledByHoverEditor,
	isHoverEditorEnabled,
} from "./HoverEditorTabs";
import { makeLeafNonEphemeral } from "./EphemeralTabs";
import { useViewState } from "src/models/ViewState";
import { getOpenFileOfLeaf } from "./GetTabs";

const EXCLUSION_LIST = new Set([
	"file-explorer",
	"search",
	"bookmarks",
	"tag",
	"backlink",
	"outgoing-link",
	"outline",
	"file-properties",
	"sync",
	"all-properties",
	"localgraph",
]);

interface DeduplicateOptions {
	deduplicateSidebarTabs: boolean;
	deduplicatePopupTabs: boolean;
}

function iterateTabs(
	app: App,
	options: DeduplicateOptions,
	callback: (leaf: WorkspaceLeaf) => void
) {
	const workspace = app.workspace;
	const { rootSplit, leftSplit, rightSplit, floatingSplit } = workspace;
	workspace.iterateLeaves(rootSplit, callback);
	if (options.deduplicateSidebarTabs) {
		workspace.iterateLeaves(leftSplit, callback);
		workspace.iterateLeaves(rightSplit, callback);
	}
	if (options.deduplicatePopupTabs) {
		workspace.iterateLeaves(floatingSplit, callback);
	}
}

export function deduplicateTab(
	app: App,
	file: TFile | null,
	focus = true
): WorkspaceLeaf | null {
	if (!file) return null;
	const targetLeaves: WorkspaceLeaf[] = [];
	const options = useSettings.getState();
	const skipLeaves = getLeaveIDsControlledByHoverEditor(app);
	iterateTabs(app, options, (leaf) => {
		if (skipLeaves.includes(leaf.id)) return;
		const viewType = leaf.view.getViewType();
		if (EXCLUSION_LIST.has(viewType)) return;
		const openFile = getOpenFileOfLeaf(app, leaf);
		if (openFile === file) targetLeaves.push(leaf);
	});
	const sortedLeaves = targetLeaves.sort(
		(a, b) => b.activeTime - a.activeTime
	);
	const latestOldLeaf = sortedLeaves
		.filter((leaf) => leaf.activeTime > 0)
		.last();
	const leafToKeep = sortedLeaves.pop();
	if (!leafToKeep) return null;
	// We don't close the newly created leaf, otherwise Obsidian will try to unload partially loaded view.
	// We therefore treat the newly created leaf as the oldest leaf, whose active time (0) is the smallest.
	// But we migrate the ephemeral status and history to it.
	if (latestOldLeaf && latestOldLeaf.id != leafToKeep.id) {
		if (!latestOldLeaf.isEphemeral) makeLeafNonEphemeral(leafToKeep);
		const { backHistory, forwardHistory } = latestOldLeaf.history;
		leafToKeep.history.backHistory = backHistory;
		leafToKeep.history.forwardHistory = forwardHistory;
	}
	sortedLeaves.forEach((leaf) => leaf.detach());
	loadDeferredLeaf(leafToKeep);
	// If Hover Editor is enabled, we let Hover Editor take care of the focus.
	// Otherwise, Hover Editor will be closed when we set the focus.
	if (focus && !isHoverEditorEnabled(app)) {
		app.workspace.setActiveLeaf(leafToKeep, { focus: false });
		return leafToKeep;
	}
	return null;
}

export function deduplicateExistingTabs(app: App): WorkspaceLeaf | null {
	const openFiles: TFile[] = [];
	app.workspace.iterateAllLeaves((leaf) => {
		const path = leaf.getViewState().state?.file as string | undefined;
		if (leaf.view instanceof FileView) {
			const file = leaf.view.file;
			if (file instanceof TFile) openFiles.push(file);
		} else if (path) {
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) openFiles.push(file);
		}
	});
	const uniqueFiles = new Set(openFiles);
	const activeFile = app.workspace.getActiveFile();
	if (activeFile instanceof TFile) {
		uniqueFiles.delete(activeFile);
	}
	uniqueFiles.forEach((file) => deduplicateTab(app, file, false));
	if (activeFile instanceof TFile) {
		const latestActiveLeaf = useViewState.getState().latestActiveLeaf;
		// Only focus on the deduplicated tab if the active file is still open.
		const focus =
			!!latestActiveLeaf &&
			getOpenFileOfLeaf(app, latestActiveLeaf) === activeFile;
		return deduplicateTab(app, activeFile, focus);
	}
	return null;
}
