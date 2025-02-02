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
import { Identifier } from "src/models/VTWorkspace";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { moveTab, reapplyEphemeralState } from "./MoveTab";

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

type TargetLeavesRecord = DefaultRecord<Identifier, WorkspaceLeaf[]>;
const createNewTargetLeavesRecord = () =>
	new DefaultRecord(() => []) as TargetLeavesRecord;

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

export function deduplicateTabForTargets(
	app: App,
	targetLeaves: WorkspaceLeaf[],
	focus = true
): WorkspaceLeaf | null {
	const sortedLeaves = targetLeaves.sort((a, b) => {
		const aCreationTime = a.guessedCreationTime ?? a.activeTime;
		const bCreationTime = b.guessedCreationTime ?? b.activeTime;
		return bCreationTime - aCreationTime;
	});
	const latestOldLeaf = sortedLeaves
		.filter((leaf) => (leaf.guessedCreationTime ?? leaf.activeTime) > 0)
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
		moveTab(app, leafToKeep.id, latestOldLeaf.id);
		reapplyEphemeralState(leafToKeep, latestOldLeaf.getEphemeralState());
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

export function deduplicateTab(
	app: App,
	file: TFile | null,
	deduplicateSameGroupTabs: boolean,
	focus = true
): WorkspaceLeaf | null {
	if (!file) return null;
	const targetLeaves: WorkspaceLeaf[] = [];
	const options = useSettings.getState() as DeduplicateOptions;
	const skipLeaves = getLeaveIDsControlledByHoverEditor(app);
	iterateTabs(app, options, (leaf) => {
		if (skipLeaves.includes(leaf.id)) return;
		const viewType = leaf.view.getViewType();
		if (EXCLUSION_LIST.has(viewType)) return;
		if (leaf.parent?.isLinkedGroup && leaf.isLinkedFile) return;
		const openFile = getOpenFileOfLeaf(app, leaf);
		if (openFile === file) targetLeaves.push(leaf);
	});
	if (deduplicateSameGroupTabs) {
		const targetLeavesByGroups = createNewTargetLeavesRecord();
		targetLeaves.forEach((leaf) => {
			const group = leaf.parent;
			if (!group) return;
			const leaves = targetLeavesByGroups.get(group.id);
			leaves.push(leaf);
			targetLeavesByGroups.set(group.id, leaves);
		});
		const possibleActiveLeaves: WorkspaceLeaf[] = [];
		for (const leaves of targetLeavesByGroups.values()) {
			const candidates = deduplicateTabForTargets(app, leaves, focus);
			if (candidates) possibleActiveLeaves.push(candidates);
		}
		return possibleActiveLeaves.last() ?? null;
	} else {
		return deduplicateTabForTargets(app, targetLeaves, focus);
	}
}

export function deduplicateExistingTabs(
	app: App,
	overrideSameGroupPolicy = false
) {
	const openFiles: TFile[] = [];
	let hasLinkedLeaf = false;
	app.workspace.iterateAllLeaves((leaf) => {
		const path = leaf.getViewState().state?.file as string | undefined;
		if (leaf.view instanceof FileView) {
			const file = leaf.view.file;
			if (file instanceof TFile) openFiles.push(file);
		} else if (path) {
			const file = app.vault.getAbstractFileByPath(path);
			if (file instanceof TFile) openFiles.push(file);
		}
		if (leaf.parent?.isLinkedGroup && leaf.isLinkedFile) {
			hasLinkedLeaf = true;
		}
	});
	const uniqueFiles = new Set(openFiles);
	const activeFile = app.workspace.getActiveFile();
	if (activeFile instanceof TFile) {
		uniqueFiles.delete(activeFile);
	}
	const deduplicateSameGroupTabs = overrideSameGroupPolicy
		? false
		: useSettings.getState().deduplicateSameGroupTabs;
	uniqueFiles.forEach((file) =>
		deduplicateTab(app, file, deduplicateSameGroupTabs, false)
	);
	if (activeFile instanceof TFile) {
		const latestActiveLeaf = useViewState.getState().latestActiveLeaf;
		// Only focus on the deduplicated tab if the active file is still open
		// and we are deduplicating different-group tabs and there is no linked leaf.
		const focus =
			!!latestActiveLeaf &&
			!deduplicateSameGroupTabs &&
			!hasLinkedLeaf &&
			getOpenFileOfLeaf(app, latestActiveLeaf) === activeFile;
		const activeLeaf = deduplicateTab(
			app,
			activeFile,
			deduplicateSameGroupTabs,
			focus
		);
		if (activeLeaf) {
			app.workspace.setActiveLeaf(activeLeaf, { focus: false });
		}
	}
}
