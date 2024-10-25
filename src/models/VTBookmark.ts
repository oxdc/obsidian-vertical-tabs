import {
	App,
	BookmarkFileItem,
	VTBookmarkGroupItem,
	WorkspaceLeaf,
	WorkspaceParent,
	TFile,
	BookmarkSearchItem,
	BookmarkGraphItem,
	View,
	BookmarkItem,
	BookmarkWebItem,
} from "obsidian";
import { DeduplicatedTitle } from "src/services/DeduplicateTitle";
import { loadDeferredLeaf } from "src/services/LoadDeferredLeaf";

function NewBookmarkGroupItem(title?: string): VTBookmarkGroupItem {
	return {
		type: "group",
		ctime: Date.now(),
		items: [],
		title: title || "Untitled group",
		isCreatedByVT: true,
	};
}

interface GraphView extends View {
	dataEngine: {
		getOptions: () => unknown;
	};
}

function isGraphView(view: View): view is GraphView {
	return "dataEngine" in view;
}

function NewBookmarkGraphItem(
	options: unknown,
	title?: string
): BookmarkGraphItem {
	return {
		type: "graph",
		ctime: Date.now(),
		title: title || "Untitled graph",
		options,
	};
}

interface SearchView extends View {
	getQuery: () => string;
}

function isSearchView(view: View): view is SearchView {
	return "getQuery" in view;
}

function NewBookmarkSearchItem(
	query: string,
	title?: string
): BookmarkSearchItem {
	return {
		type: "search",
		ctime: Date.now(),
		title: title || query,
		query,
	};
}

interface FileView extends View {
	file?: TFile | null;
}

function isFileView(view: View): view is FileView {
	return "file" in view || "file" in view.getState();
}

function NewBookmarkFileItem(
	file: TFile,
	title?: string,
	subpath?: string
): BookmarkFileItem {
	return {
		type: "file",
		ctime: Date.now(),
		title: title || file.basename,
		path: file.path,
		subpath,
	};
}

interface WebView extends View {
	url: string;
}

function isWebView(view: View): view is WebView {
	return "url" in view;
}

function NewBookmarkWebItem(url: string, title?: string): BookmarkWebItem {
	return {
		type: "url",
		ctime: Date.now(),
		title: title || "",
		url,
	};
}

function NewBookmarkForView(
	app: App,
	view: View,
	title?: string
): BookmarkItem | null {
	if (isGraphView(view)) {
		return NewBookmarkGraphItem(view.dataEngine.getOptions(), title);
	} else if (isSearchView(view)) {
		return NewBookmarkSearchItem(view.getQuery(), title);
	} else if (isFileView(view)) {
		if (view.file) {
			return NewBookmarkFileItem(view.file, title);
		} else {
			const path = view.getState().file as string | undefined;
			if (!path) return null;
			const file = app.vault.getFileByPath(path);
			if (!file) return null;
			return NewBookmarkFileItem(file, title);
		}
	} else if (isWebView(view)) {
		return NewBookmarkWebItem(view.url, title);
	} else {
		return null;
	}
}

export async function createBookmarkForGroup(
	app: App,
	group: WorkspaceParent,
	title: string
) {
	const bookmarks = app.internalPlugins.plugins.bookmarks;
	if (!bookmarks.enabled) return;
	const bookmark = NewBookmarkGroupItem();
	bookmark.title = title;
	for (const child of group.children) {
		await loadDeferredLeaf(child);
		const view = child.view;
		const title = DeduplicatedTitle(app, child);
		const item = NewBookmarkForView(app, view, title);
		if (item) bookmark.items.push(item);
	}
	bookmarks.instance.addItem(bookmark);
	setTimeout(() => {
		bookmarks.instance.saveData();
	}, 1000);
}

export async function createBookmarkForLeaf(
	app: App,
	leaf: WorkspaceLeaf,
	title: string
) {
	const bookmarks = app.internalPlugins.plugins.bookmarks;
	if (!bookmarks.enabled) return;
	await loadDeferredLeaf(leaf);
	const item = NewBookmarkForView(app, leaf.view, title);
	if (item) bookmarks.instance.addItem(item);
}
