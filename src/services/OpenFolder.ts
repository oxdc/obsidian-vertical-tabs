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

export class LinkedFolder {
	app: App;
	folder: TFolder;
	files: TFile[];
	offset = 0;
	newLeaf: WorkspaceLeaf | null = null;
	group: WorkspaceParent | null = null;

	constructor(app: App, folder: TFolder, recursive: boolean) {
		this.app = app;
		this.folder = folder;
		this.files = recursive
			? getFilesRecursivelyInFolder(folder)
			: getFilesInFolder(folder);
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

	getLimit() {
		return useSettings.getState().linkedFolderLimit;
	}

	async openNextFiles(replace: boolean): Promise<boolean> {
		if (!this.group) return false;
		const limit = this.getLimit();
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
			await leaf.openFile(file, { active: false });
			makeLeafNonEphemeral(leaf);
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
