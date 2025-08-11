import { App, WorkspaceLeaf } from "obsidian";
import { getOpenFileOfLeaf } from "./GetTabs";

export function onDragLeaf(
	app: App,
	event: React.DragEvent,
	leaf: WorkspaceLeaf
) {
	app.workspace.onDragLeaf(event.nativeEvent, leaf);
}

export function onDragFile(
	app: App,
	event: React.DragEvent,
	leaf: WorkspaceLeaf
) {
	const file = getOpenFileOfLeaf(app, leaf);
	const dataTransfer = event.nativeEvent.dataTransfer;
	if (!file || !dataTransfer) return;
	const fileData = { filePath: file.path };
	dataTransfer.setData("application/json", JSON.stringify(fileData));
	const dragData = app.dragManager.dragFile(event.nativeEvent, file, leaf);
	app.dragManager.onDragStart(event.nativeEvent, dragData);
}
