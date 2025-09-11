import { App, Menu, TFile } from "obsidian";
import { DEFAULT_GROUP_TITLE, useViewState } from "src/models/ViewState";
import { moveTabToEnd } from "./MoveTab";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { GroupType } from "src/models/VTWorkspace";

const MENU_SECTION = "file-navigation";

function checkIfMenuIsAlreadyAdded(menu: Menu) {
	return menu.items.map((item) => item.section).includes(MENU_SECTION);
}

export function addMenuItemsToFileContextMenu(
	app: App,
	menu: Menu,
	file: TFile
) {
	if (checkIfMenuIsAlreadyAdded(menu)) return;
	const entries = tabCacheStore.getState().content.values();
	const groups = entries
		.filter((entry) => entry.groupType === GroupType.RootSplit)
		.map((entry) => entry.group)
		.filter((group) => group !== null);
	const groupTitles = useViewState.getState().groupTitles;
	menu.addItem((item) => {
		item.setSection(MENU_SECTION).setTitle("Open file in tab group...");
		const submenu = item.setSubmenu();
		groups.forEach((group) => {
			submenu.addItem((item) => {
				const title = groupTitles.get(group.id) || DEFAULT_GROUP_TITLE;
				item.setTitle(title).onClick(() => {
					const leaf = app.workspace.getLeaf("split");
					leaf.openFile(file);
					moveTabToEnd(app, leaf.id, group);
				});
			});
		});
	});
}
