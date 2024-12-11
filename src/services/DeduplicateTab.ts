import { App, FileView, TFile, WorkspaceLeaf } from "obsidian";
import { loadDeferredLeaf } from "./LoadDeferredLeaf";

function iterateRootOrFloatingLeaves(
	app: App,
	callback: (leaf: WorkspaceLeaf) => void
) {
	const workspace = app.workspace;
	const { rootSplit, floatingSplit } = workspace;
	workspace.iterateLeaves(rootSplit, callback);
	workspace.iterateLeaves(floatingSplit, callback);
}

export function deduplicateTab(
	app: App,
	file: TFile | null,
	focus = true
): WorkspaceLeaf | null {
	if (!file) return null;
	const targetLeaves: WorkspaceLeaf[] = [];
	iterateRootOrFloatingLeaves(app, (leaf) => {
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
	if (focus) {
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
