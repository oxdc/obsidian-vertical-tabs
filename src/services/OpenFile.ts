import { App, Menu, MenuItem, TFile } from "obsidian";
import { moveTabToEnd } from "./MoveTab";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { GroupType } from "src/models/VTWorkspace";
import { GroupNameModal } from "src/views/GroupNameModal";
import { getGroupTitle, setGroupTitle } from "./Customization";

const MENU_SECTION = "file-navigation";

function checkIfMenuIsAlreadyAdded(menu: Menu) {
	return menu.items
		.filter((item) => item instanceof MenuItem)
		.map((item) => item.section)
		.includes(MENU_SECTION);
}

export function addMenuItemsToFileContextMenu(
	app: App,
	menu: Menu,
	file: TFile
) {
	if (checkIfMenuIsAlreadyAdded(menu)) return;
	const entries = Array.from(tabCacheStore.getState().content.values());
	const groups = entries
		.filter((entry) => entry.groupType === GroupType.RootSplit)
		.map((entry) => entry.group)
		.filter((group) => group !== null);
	menu.addItem((item) => {
		item.setSection(MENU_SECTION).setTitle("Open file in tab group...");
		const submenu = item.setSubmenu();
		groups.forEach((group) => {
			submenu.addItem((item) => {
				const title = getGroupTitle(group.id);
				item.setTitle(title).onClick(() => {
					const leaf = app.workspace.getLeaf("split");
					void leaf.openFile(file);
					moveTabToEnd(app, leaf.id, group);
				});
			});
		});
		submenu.addSeparator();
		submenu.addItem((item) => {
			item.setTitle("New group").onClick(() => {
				const leaf = app.workspace.getLeaf("split");
				void leaf.openFile(file);
			});
		});
		submenu.addItem((item) => {
			item.setTitle("New group with name...").onClick(() => {
				new GroupNameModal(app, (groupName) => {
					const leaf = app.workspace.getLeaf("split");
					void leaf.openFile(file);
					window.setTimeout(() => {
						const group = leaf.parent;
						if (group) void setGroupTitle(group.id, groupName);
					});
				}).open();
			});
		});
	});
}
