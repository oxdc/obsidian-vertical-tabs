import { Menu, setIcon, WorkspaceLeaf } from "obsidian";
import {
	DEFAULT_GROUP_TITLE,
	PREDEFINED_COLORS,
} from "src/constants/Predefined";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { Identifier } from "src/models/VTWorkspace";

export const getGroupTitle = (groupId: Identifier) =>
	tabCacheStore.getState().groupMetadata.get(groupId)?.title ??
	DEFAULT_GROUP_TITLE;

export const setGroupTitle = (groupId: Identifier, title: string) =>
	tabCacheStore.getActions().saveGroupMetadata(groupId, { title });

export const addColorOptionsToMenu = (
	menu: Menu,
	setColor: (color: string) => void,
	resetColor: () => void
) => {
	menu.addItem((item) =>
		item.setSection("color").setTitle("Default").onClick(resetColor)
	);
	for (const [name, color] of PREDEFINED_COLORS) {
		menu.addItem((item) =>
			item
				.setSection("color")
				.setTitle(name)
				.onClick(() => setColor(color))
		);
	}
};

export const applyColor = (element: HTMLElement | undefined, color: string) => {
	if (!element) return;
	element.dataset.color = color;
	element.style.setProperty("--vt-custom-color", color);
};

export const removeColor = (element: HTMLElement | undefined) => {
	if (!element) return;
	delete element.dataset.color;
	element.style.removeProperty("--vt-custom-color");
};

export const applyIcon = (element: HTMLElement | undefined, icon: string) => {
	if (!element) return;
	element.dataset.icon = icon;
	setIcon(element, icon);
};

export const removeIcon = (
	element: HTMLElement | undefined,
	defaultIcon: string | undefined
) => {
	if (!element) return;
	delete element.dataset.icon;
	setIcon(element, defaultIcon ?? "");
};

export const applyTabTitle = (leaf: WorkspaceLeaf) => {
	const title = tabCacheStore.getState().tabMetadata.get(leaf.id)?.title;
	if (title) leaf.tabHeaderInnerTitleEl?.setText(title);
};
