import { App, MarkdownView, WorkspaceLeaf } from "obsidian";

export function insertToEditor(app: App, text: string, leaf?: WorkspaceLeaf) {
	const view = leaf
		? leaf.view
		: app.workspace.getActiveViewOfType(MarkdownView);
	if (!view || !(view instanceof MarkdownView)) return;
	view.editor.replaceRange(text, view.editor.getCursor());
	view.editor.setCursor(view.editor.getCursor());
}
