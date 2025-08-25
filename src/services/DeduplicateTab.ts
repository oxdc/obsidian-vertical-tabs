import { App, TFile, WorkspaceLeaf, WorkspaceSplit } from "obsidian";
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
import { safeDetach } from "./CloseTabs";
import { linkTasksStore } from "src/stores/LinkTaskStore";

const INCLUDE_LIST = new Set(["markdown", "canvas", "image", "video", "pdf", "bases"]);

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
		workspace.iterateLeaves(leftSplit as WorkspaceSplit, callback);
		workspace.iterateLeaves(rightSplit as WorkspaceSplit, callback);
	}
	if (options.deduplicatePopupTabs) {
		workspace.iterateLeaves(floatingSplit, callback);
	}
}

export function deduplicateForTargets(
	app: App,
	file: TFile,
	targetLeaves: WorkspaceLeaf[],
	focus = true
): WorkspaceLeaf | null {
	const sortedLeaves = targetLeaves.sort((a, b) => {
		if (a.pinned && !b.pinned) return +1;
		if (!a.pinned && b.pinned) return -1;
		const aCreationTime = a.guessedCreationTime ?? a.activeTime ?? 0;
		const bCreationTime = b.guessedCreationTime ?? b.activeTime ?? 0;
		return bCreationTime - aCreationTime;
	});
	const latestOldLeaf = sortedLeaves
		.filter(
			(leaf) => (leaf.guessedCreationTime ?? leaf.activeTime ?? 0) > 0
		)
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
	sortedLeaves.forEach((leaf) => safeDetach(leaf));
	loadDeferredLeaf(leafToKeep);
	// If there is a link task for the file, we jump to the subpath.
	const { getTask, removeTask } = linkTasksStore.getActions();
	const task = getTask(file.path);
	if (task) {
		const { subpath } = task;
		leafToKeep.openLinkText(subpath, file.path);
		removeTask(task.name);
	}
	// Only set focus when tabs were actually closed during deduplication.
	// This prevents interference with focus management for sidebar tabs when
	// triggered by commands or other plugins. (#164)
	// If Hover Editor is enabled, we let Hover Editor take care of the focus.
	// Otherwise, Hover Editor will be closed when we set the focus.
	if (focus && sortedLeaves.length > 0 && !isHoverEditorEnabled(app)) {
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
		if (!INCLUDE_LIST.has(viewType)) return;
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
			const candidates = deduplicateForTargets(app, file, leaves, focus);
			if (candidates) possibleActiveLeaves.push(candidates);
		}
		return possibleActiveLeaves.last() ?? null;
	} else {
		return deduplicateForTargets(app, file, targetLeaves, focus);
	}
}

export function deduplicateExistingTabs(
	app: App,
	overrideSameGroupPolicy = false
) {
	const openFiles: TFile[] = [];
	let hasLinkedLeaf = false;
	app.workspace.iterateAllLeaves((leaf) => {
		const file = getOpenFileOfLeaf(app, leaf);
		if (file) openFiles.push(file);
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
		// Only focus on the deduplicated tab if the active file is still open and there is no linked leaf.
		const focus =
			!!latestActiveLeaf &&
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
