import { Platform } from "obsidian";

export enum WindowFrameStyle {
	Hidden = 1,
	Native = 2,
	Obsidian = 3,
}

export function getFrameStyle(): WindowFrameStyle {
	if (document.body.classList.contains("is-hidden-frameless")) {
		return WindowFrameStyle.Hidden;
	} else if (document.body.classList.contains("is-frameless")) {
		return WindowFrameStyle.Obsidian;
	} else {
		return WindowFrameStyle.Native;
	}
}

export function isRibbonVisible(): boolean {
	return document.body.classList.contains("show-ribbon");
}

function isControlButtonContainerEmpty(container: Element | null): boolean {
	return (
		container?.querySelector(".titlebar-button.mod-minimize") === null &&
		container?.querySelector(".titlebar-button.mod-maximize") === null &&
		container?.querySelector(".titlebar-button.mod-close") === null
	);
}

export function hasControlButtonsOnTheLeft(): boolean {
	const leftContainer = document.querySelector(
		".titlebar .titlebar-button-container.mod-left"
	);
	return !isControlButtonContainerEmpty(leftContainer) || Platform.isMacOS;
}

export function hasControlButtonsOnTheRight(): boolean {
	const rightContainer = document.querySelector(
		".titlebar .titlebar-button-container.mod-right"
	);
	return !isControlButtonContainerEmpty(rightContainer);
}
