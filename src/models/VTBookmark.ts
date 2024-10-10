import {
	App,
	BookmarkFileItem,
	BookmarkGroupItem,
	WorkspaceLeaf,
	WorkspaceParent,
	TFile,
	BookmarkSearchItem,
	BookmarkGraphItem,
	View,
	BookmarkItem,
	BookmarkWebItem,
} from "obsidian";

function NewBookmarkGroupItem(title?: string): BookmarkGroupItem {
	return {
		type: "group",
		ctime: Date.now(),
		items: [],
		title: title || "Untitled group",
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
	file: TFile | null;
}

function isFileView(view: View): view is FileView {
	return "file" in view;
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

function NewBookmarkForView(view: View): BookmarkItem | null {
	if (isGraphView(view)) {
		return NewBookmarkGraphItem(view.dataEngine.getOptions());
	} else if (isSearchView(view)) {
		return NewBookmarkSearchItem(view.getQuery());
	} else if (isFileView(view)) {
		return view.file ? NewBookmarkFileItem(view.file) : null;
	} else if (isWebView(view)) {
		return NewBookmarkWebItem(view.url);
	} else {
		return null;
	}
}

export function createBookmarkForGroup(
	app: App,
	group: WorkspaceParent,
	title: string
) {
	const bookmarks = app.internalPlugins.plugins.bookmarks;
	if (!bookmarks.enabled) return;
	const bookmark = NewBookmarkGroupItem();
	bookmark.title = title;
	group.children.forEach((child: WorkspaceLeaf) => {
		const view = child.view;
		const item = NewBookmarkForView(view);
		if (item) bookmark.items.push(item);
	});
	bookmarks.instance.addItem(bookmark);
}
