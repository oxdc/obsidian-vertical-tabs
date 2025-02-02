import {
	App,
	Menu,
	TFile,
	TFolder,
	WorkspaceLeaf,
	WorkspaceParent,
	WorkspaceSplit,
} from "obsidian";
import { moveTabToNewGroup } from "./MoveTab";
import { Identifier } from "src/models/VTWorkspace";
import { makeLeafNonEphemeral } from "./EphemeralTabs";
import { useViewState } from "src/models/ViewState";
import { useSettings } from "src/models/PluginContext";

const MENU_SECTION = "folder-navigation";

function checkIfMenuIsAlreadyAdded(menu: Menu) {
	return menu.items.map((item) => item.section).includes(MENU_SECTION);
}

export function getFilesInFolder(folder: TFolder): TFile[] {
	return folder.children.filter((child) => child instanceof TFile) as TFile[];
}

export function getFilesRecursivelyInFolder(folder: TFolder): TFile[] {
	const files = getFilesInFolder(folder);
	const folders = folder.children.filter((child) => child instanceof TFolder);
	return folders.reduce((acc, folder: TFolder) => {
		return [...acc, ...getFilesRecursivelyInFolder(folder)];
	}, files) as TFile[];
}

export type FileCompareFn = (a: TFile, b: TFile) => number;

export type FileSortStrategy = {
	compareFn: FileCompareFn;
	reverse: boolean;
};

export function sortFiles(files: TFile[], sortStrategy: FileSortStrategy) {
	files.sort(sortStrategy.compareFn);
	if (sortStrategy.reverse) files.reverse();
	return files;
}

export function byFileName(a: TFile, b: TFile) {
	return a.name.localeCompare(b.name);
}

export function byExtension(a: TFile, b: TFile) {
	const resultOfExtension = a.extension.localeCompare(b.extension);
	const resultOfBasename = a.basename.localeCompare(b.basename);
	return resultOfExtension === 0 ? resultOfBasename : resultOfExtension;
}

export function byFileCreatedTime(a: TFile, b: TFile) {
	const resultOfCreatedTime = a.stat.ctime - b.stat.ctime;
	const resultOfFileName = byFileName(a, b);
	return resultOfCreatedTime === 0 ? resultOfFileName : resultOfCreatedTime;
}

export function byFileModifiedTime(a: TFile, b: TFile) {
	const resultOfModifiedTime = a.stat.mtime - b.stat.mtime;
	const resultOfFileName = byFileName(a, b);
	return resultOfModifiedTime === 0 ? resultOfFileName : resultOfModifiedTime;
}

export function byFileSize(a: TFile, b: TFile) {
	const resultOfFileSize = a.stat.size - b.stat.size;
	const resultOfFileName = byFileName(a, b);
	return resultOfFileSize === 0 ? resultOfFileName : resultOfFileSize;
}

export const linkedFolderSortStrategies: Record<string, FileSortStrategy> = {
	fileNameAToZ: { compareFn: byFileName, reverse: false },
	fileNameZToA: { compareFn: byFileName, reverse: true },
	extensionAToZ: { compareFn: byExtension, reverse: false },
	extensionZToA: { compareFn: byExtension, reverse: true },
	createdTimeOldestFirst: { compareFn: byFileCreatedTime, reverse: false },
	createdTimeNewestFirst: { compareFn: byFileCreatedTime, reverse: true },
	modifiedTimeOldestFirst: { compareFn: byFileModifiedTime, reverse: false },
	modifiedTimeNewestFirst: { compareFn: byFileModifiedTime, reverse: true },
	fileSizeSmallestFirst: { compareFn: byFileSize, reverse: false },
	fileSizeLargestFirst: { compareFn: byFileSize, reverse: true },
};

export const linkedFolderSortStrategyOptions: Record<string, string> = {
	fileNameAToZ: "File name A to Z",
	fileNameZToA: "File name Z to A",
	extensionAToZ: "Extension A to Z",
	extensionZToA: "Extension Z to A",
	createdTimeOldestFirst: "Created time oldest first",
	createdTimeNewestFirst: "Created time newest first",
	modifiedTimeOldestFirst: "Modified time oldest first",
	modifiedTimeNewestFirst: "Modified time newest first",
	fileSizeSmallestFirst: "File size smallest first",
	fileSizeLargestFirst: "File size largest first",
};

export class LinkedFolder {
	app: App;
	folder: TFolder;
	files: TFile[];
	offset = 0;
	newLeaf: WorkspaceLeaf | null = null;
	group: WorkspaceParent | null = null;

	private static getLimit() {
		return useSettings.getState().linkedFolderLimit;
	}

	private static getSortStrategy() {
		return useSettings.getState().linkedFolderSortStrategy;
	}

	constructor(app: App, folder: TFolder, recursive: boolean) {
		this.app = app;
		this.folder = folder;
		this.files = recursive
			? getFilesRecursivelyInFolder(folder)
			: getFilesInFolder(folder);
		const sortStrategyName = LinkedFolder.getSortStrategy();
		const sortStrategy = linkedFolderSortStrategies[sortStrategyName];
		sortFiles(this.files, sortStrategy);
	}

	async createNewGroup(): Promise<Identifier | null> {
		const leaf = this.app.workspace.getLeaf("tab");
		const movedLeaf = await moveTabToNewGroup(this.app, leaf.id);
		if (!movedLeaf) return null;
		const group = movedLeaf.parent;
		if (!group) {
			movedLeaf.detach();
			return null;
		}
		this.newLeaf = movedLeaf;
		this.group = group;
		return group.id;
	}

	async openNextFiles(replace: boolean): Promise<boolean> {
		if (!this.group) return false;
		const limit = LinkedFolder.getLimit();
		const files = this.files.slice(this.offset, this.offset + limit);
		if (files.length === 0) return false;
		this.offset += limit;
		files.forEach(async (file, index) => {
			let leaf = null;
			const split = this.group as WorkspaceSplit;
			const tabIndex = replace ? index : split.children.length;
			leaf =
				replace && split && split.children.length > index
					? split.children[index]
					: this.app.workspace.createLeafInParent(split, tabIndex);
			makeLeafNonEphemeral(leaf);
			await leaf.openFile(file, { active: false });
		});
		if (
			replace &&
			this.group &&
			this.group.children.length > files.length
		) {
			this.group.children.slice(files.length).forEach((leaf) => {
				leaf.detach();
			});
		}
		this.newLeaf?.detach();
		return true;
	}
}

async function handleOpenFolder(app: App, folder: TFolder, recursive: boolean) {
	const linkedFolder = new LinkedFolder(app, folder, recursive);
	const groupID = await linkedFolder.createNewGroup();
	if (!groupID) return;
	useViewState.getState().addLinkedGroup(groupID, linkedFolder);
	linkedFolder.openNextFiles(false);
}

export function addMenuItemsToFolderContextMenu(
	app: App,
	menu: Menu,
	folder: TFolder
) {
	if (checkIfMenuIsAlreadyAdded(menu)) return;
	menu.addItem((item) =>
		item
			.setSection("folder-navigation")
			.setTitle("Open folder in new group")
			.onClick(() => handleOpenFolder(app, folder, false))
	);
	menu.addItem((item) =>
		item
			.setSection("folder-navigation")
			.setTitle("Open folder recursively in new group")
			.onClick(() => handleOpenFolder(app, folder, true))
	);
}
