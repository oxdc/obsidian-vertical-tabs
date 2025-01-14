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

export interface BindedFolderOptions {
	recursive?: boolean;
	limits?: number;
}

export class BindedFolder {
	app: App;
	folder: TFolder;
	files: TFile[];
	offset = 0;
	limits = 10;
	newLeaf: WorkspaceLeaf | null = null;
	group: WorkspaceParent | null = null;

	constructor(app: App, folder: TFolder, options: BindedFolderOptions = {}) {
		this.app = app;
		this.folder = folder;
		this.files = options.recursive
			? getFilesRecursivelyInFolder(folder)
			: getFilesInFolder(folder);
		this.limits = options.limits || this.limits;
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

	async openNextFiles(): Promise<boolean> {
		if (!this.group) return false;
		const files = this.files.slice(this.offset, this.offset + this.limits);
		if (files.length === 0) return false;
		this.offset += this.limits;
		files.forEach(async (file, index) => {
			const leaf = this.app.workspace.createLeafInParent(
				this.group as WorkspaceSplit,
				index
			);
			await leaf.openFile(file);
			makeLeafNonEphemeral(leaf);
		});
		this.newLeaf?.detach();
		return true;
	}
}

async function handleOpenFolder(app: App, folder: TFolder, recursive: boolean) {
	const options = {
		recursive,
	};
	const bindedFolder = new BindedFolder(app, folder, options);
	const groupID = await bindedFolder.createNewGroup();
	if (!groupID) return;
	useViewState.getState().addBindedGroup(groupID, bindedFolder);
	bindedFolder.openNextFiles();
}

export function addMenuItemsToFolderContextMenu(
	app: App,
	menu: Menu,
	folder: TFolder
) {
	if (checkIfMenuIsAlreadyAdded(menu)) return;
	menu.addItem((item) => {
		item.setSection("folder-navigation")
			.setTitle("Open folder in new group")
			.onClick(() => handleOpenFolder(app, folder, false));
	});
	menu.addItem((item) => {
		item.setSection("folder-navigation")
			.setTitle("Open folder recursively in new group")
			.onClick(() => handleOpenFolder(app, folder, true));
	});
}
