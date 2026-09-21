import { Menu } from "obsidian";

export function createVTMenu(attribute: string) {
	const menu = new Menu();
	menu.isVTMenu = true;
	menu.VTMenuAttribute = attribute;
	menu.dom.classList.add("vt-menu");
	return menu;
}
