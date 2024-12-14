import { App, FileView, TFile, WorkspaceLeaf } from "obsidian";
import { loadDeferredLeaf } from "./LoadDeferredLeaf";
import { iterateRootOrFloatingLeaves } from "./GetTabs";
import { useSettings } from "src/models/PluginContext";
import {
	getLeaveIDsControlledByHoverEditor,
	isHoverEditorEnabled,
} from "./HoverEditorTabs";

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
]);

function iterateTabs(
	app: App,
	includeSidebar = false,
	callback: (leaf: WorkspaceLeaf) => void
) {
	if (includeSidebar) app.workspace.iterateAllLeaves(callback);
	else iterateRootOrFloatingLeaves(app, callback);
}

export function deduplicateTab(
	app: App,
	file: TFile | null,
	focus = true
): WorkspaceLeaf | null {
	if (!file) return null;
	const targetLeaves: WorkspaceLeaf[] = [];
	const includeSidebar = useSettings.getState().deduplicateSidebarTabs;
	const skipLeaves = getLeaveIDsControlledByHoverEditor(app);
	iterateTabs(app, includeSidebar, (leaf) => {
		if (skipLeaves.includes(leaf.id)) return;
		const viewType = leaf.view.getViewType();
		if (EXCLUSION_LIST.has(viewType)) return;
		if (leaf.view instanceof FileView && leaf.view.file === file) {
			targetLeaves.push(leaf);
		} else if (leaf.getViewState().state?.file === file.path) {
			targetLeaves.push(leaf);
		}
	});
	const sortedLeaves = targetLeaves.sort(
		(leaf, another) => leaf.activeTime - another.activeTime
	);
	const leafToKeep = sortedLeaves.first();
	if (!leafToKeep) return null;
	const leavesToClose = sortedLeaves.slice(1);
	leavesToClose.forEach((leaf) => leaf.detach());
	loadDeferredLeaf(leafToKeep);
	// If Hover Editor is enabled, we let Hover Editor take care of the focus.
	// Otherwise, Hover Editor will be closed when we set the focus.
	if (focus && !isHoverEditorEnabled(app)) {
		app.workspace.setActiveLeaf(leafToKeep, { focus: true });
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
		return deduplicateTab(app, activeFile, true);
	}
	return null;
}
