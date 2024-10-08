import {
	App,
	BookmarkFileItem,
	BookmarkGroupItem,
	WorkspaceLeaf,
	WorkspaceParent,
} from "obsidian";

function NewBookmarkFileItem(): BookmarkFileItem {
	return {
		ctime: Date.now(),
		title: "Untitled",
		type: "file",
		path: "",
	};
}

function NewBookmarkGroupItem(): BookmarkGroupItem {
	return {
		ctime: Date.now(),
		title: "Untitled",
		type: "group",
		items: [],
	};
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
		const item = NewBookmarkFileItem();
		const viewState = child.getViewState() as any;
		item.title = viewState.title;
		item.path = viewState.state.file;
		bookmark.items.push(item);
	});
	bookmarks.instance.addItem(bookmark);
}
