import { App, FileView, TFile, WorkspaceLeaf } from "obsidian";
import { loadDeferredLeaf } from "./LoadDeferredLeaf";

export function deduplicateTab(app: App, file: TFile | null, focus = true) {
	if (!file) return;
	const targetLeaves: WorkspaceLeaf[] = [];
	app.workspace.iterateRootLeaves((leaf) => {
		if (leaf.view instanceof FileView && leaf.view.file === file) {
			targetLeaves.push(leaf);
		} else if (leaf.getViewState().state?.file === file.path) {
			targetLeaves.push(leaf);
		}
	});
	const earliestTime = targetLeaves.reduce((acc, leaf) => {
		return Math.min(acc, leaf.activeTime);
	}, Infinity);
	if (earliestTime === Infinity) return;
	const leavesToClose = targetLeaves.filter(
		(leaf) => leaf.activeTime !== earliestTime
	);
	leavesToClose.forEach((leaf) => leaf.detach());
	const leafToKeep = targetLeaves.first();
	if (!leafToKeep) return;
	loadDeferredLeaf(leafToKeep);
	if (focus) {
		app.workspace.setActiveLeaf(leafToKeep, { focus: true });
		app.workspace.onLayoutChange();
	}
}

export function deduplicateExistingTabs(app: App) {
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
		deduplicateTab(app, activeFile, true);
	}
}
