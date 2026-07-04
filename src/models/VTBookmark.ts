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
	HistoryState,
	MarkdownViewState,
	ViewState,
	Notice,
} from "obsidian";
import { DeduplicatedTitle } from "src/services/DeduplicateTitle";
import { loadDeferredLeaf } from "src/services/LoadDeferredLeaf";

function getBookmarksPluginInstance(app: App) {
	const bookmarks = app.internalPlugins.plugins.bookmarks;
	if (!bookmarks.enabled) return null;
	return bookmarks.instance;
}

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

function isMarkdownViewState(state: ViewState): state is MarkdownViewState {
	return !!state && "type" in state && state.type === "markdown";
}

function NewFileBookmarkForHistoryState(
	app: App,
	state: HistoryState
): BookmarkFileItem | null {
	if (!isMarkdownViewState(state.state)) return null;
	const viewState = state.state;
	const file = app.vault.getFileByPath(viewState.state.file);
	if (!file) return null;
	return NewBookmarkFileItem(file, state.state.title);
}

function forceSaveBookmarks(app: App) {
	const instance = getBookmarksPluginInstance(app);
	if (!instance) return;
	window.setTimeout(() => {
		instance.saveData();
	}, 1000);
}

export async function createBookmarkForGroup(
	app: App,
	group: WorkspaceParent,
	title: string
) {
	const instance = getBookmarksPluginInstance(app);
	if (!instance) return;
	const bookmark = NewBookmarkGroupItem();
	bookmark.title = title;
	for (const child of group.children) {
		await loadDeferredLeaf(child);
		const view = child.view;
		const title = DeduplicatedTitle(app, child);
		const item = NewBookmarkForView(app, view, title);
		if (item) bookmark.items.push(item);
	}
	instance.addItem(bookmark);
	new Notice(`Created bookmark ${title}`);
	forceSaveBookmarks(app);
}

export async function createBookmarkForLeaf(
	app: App,
	leaf: WorkspaceLeaf,
	title: string
) {
	const instance = getBookmarksPluginInstance(app);
	if (!instance) return;
	await loadDeferredLeaf(leaf);
	const item = NewBookmarkForView(app, leaf.view, title);
	if (item) instance.addItem(item);
	new Notice(`Created bookmark ${title}`);
	forceSaveBookmarks(app);
}

export async function createBookmarkForLeafHistory(
	app: App,
	leaf: WorkspaceLeaf
) {
	const instance = getBookmarksPluginInstance(app);
	if (!instance) return;
	await loadDeferredLeaf(leaf);
	const bookmark = NewBookmarkGroupItem();
	const leafTitle = DeduplicatedTitle(app, leaf);
	const title = `History: ${leafTitle}`;
	bookmark.title = title;
	const { backHistory, forwardHistory } = leaf.history;
	backHistory.forEach((state) => {
		const item = NewFileBookmarkForHistoryState(app, state);
		if (item) bookmark.items.push(item);
	});
	const currentItem = NewBookmarkForView(
		app,
		leaf.view,
		`${leafTitle} (last viewed)`
	);
	if (currentItem) bookmark.items.push(currentItem);
	forwardHistory.forEach((state) => {
		const item = NewFileBookmarkForHistoryState(app, state);
		if (item) bookmark.items.push(item);
	});
	instance.addItem(bookmark);
	new Notice(`Created bookmark ${title}`);
	forceSaveBookmarks(app);
}

export async function loadNameFromBookmark(
	app: App,
	group: WorkspaceParent
): Promise<string | undefined> {
	const instance = getBookmarksPluginInstance(app);
	if (!instance) return;
	return await findNamesIteratively(
		instance.items as unknown as BookmarkItem[],
		group
	);
}

async function findNamesIteratively(
	items: BookmarkItem[],
	group: WorkspaceParent,
	title?: string
): Promise<string | undefined> {
	const groupItems = items.filter((item) => item.type === "group");
	if (groupItems.length > 0) {
		const possibleTitles = [];
		for (const groupItem of groupItems as VTBookmarkGroupItem[]) {
			if (!groupItem.isCreatedByVT) continue;
			const possibleTitle = await findNamesIteratively(
				groupItem.items,
				group,
				groupItem.title
			);
			if (possibleTitle) possibleTitles.push(possibleTitle);
		}
		if (possibleTitles.length > 0) return possibleTitles[0];
	} else {
		if (await checkContents(items, group)) {
			return title;
		}
	}
	return undefined;
}

function getFilePathFromView(view: FileView): string | null {
	if (view.file) {
		return view.file.path;
	} else {
		return view.getState().file as string | null;
	}
}

async function checkContents(
	items: BookmarkItem[],
	group: WorkspaceParent
): Promise<boolean> {
	if (items.length === 0 || items.length !== group.children.length) {
		return false;
	}
	for (const item of items) {
		if (item.type === "file") {
			let matchLeaf = false;
			for (const child of group.children) {
				await loadDeferredLeaf(child);
				const fileItem = item as BookmarkFileItem;
				const viewPath = getFilePathFromView(child.view);
				if (isFileView(child.view) && viewPath === fileItem.path) {
					matchLeaf = true;
					break;
				}
			}
			if (!matchLeaf) return false;
		} else if (item.type === "graph") {
			let matchLeaf = false;
			for (const child of group.children) {
				await loadDeferredLeaf(child);
				if (isGraphView(child.view)) {
					matchLeaf = true;
					break;
				}
			}
			if (!matchLeaf) return false;
		} else {
			return false;
		}
	}
	return true;
}
