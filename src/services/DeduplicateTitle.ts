import { App, WorkspaceLeaf } from "obsidian";

function hideExtension(file: string) {
	const dot = file.lastIndexOf(".");
	return dot === -1 ? file : file.slice(0, dot);
}

export function DeduplicatedTitle(app: App, leaf: WorkspaceLeaf) {
	const workspace = app.workspace;
	const viewState = leaf.getViewState();
	const myDefaultTitle = leaf.getDisplayText();
	if (viewState.type !== "markdown") return myDefaultTitle;
	const state = viewState.state;
	if (!state || !state.file) return myDefaultTitle;
	const file = state.file as string;
	let hasDuplicates = false;
	workspace.getLeavesOfType("markdown").forEach((other: WorkspaceLeaf) => {
		if (
			other.id !== leaf.id &&
			other.getViewState().state?.file !== file &&
			other.getDisplayText() === myDefaultTitle
		) {
			hasDuplicates = true;
		}
	});
	return hasDuplicates ? hideExtension(file) : myDefaultTitle;
}
