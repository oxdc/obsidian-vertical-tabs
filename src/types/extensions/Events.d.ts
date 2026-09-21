import { Menu, EventRef } from "obsidian";
import { EVENTS } from "src/constants/Events";
import { GroupViewType } from "src/models/VTGroupView";

export {};

// prettier-ignore
declare module "obsidian" {
	interface Workspace {
		on(name: typeof EVENTS.UPDATE_TOGGLE, callback: () => void): EventRef;
		on(name: typeof EVENTS.EPHEMERAL_TABS_INIT, callback: (autoClose: boolean) => void): EventRef;
		on(name: typeof EVENTS.EPHEMERAL_TABS_DEINIT, callback: () => void): EventRef;
		on(name: typeof EVENTS.EPHEMERAL_TABS_UPDATE, callback: (enabled: boolean, autoClose: boolean) => void): EventRef;
		on(name: typeof EVENTS.DEDUPLICATE_TABS, callback: () => void): EventRef;
		on(name: typeof EVENTS.ENHANCED_KEYBOARD_TAB_SWITCH, callback: () => void): EventRef;
		on(name: typeof EVENTS.RESET_KEYBOARD_TAB_SWITCH, callback: () => void): EventRef;
		on(name: typeof EVENTS.ALT_KEY_PRESSED, callback: () => void): EventRef;
		on(name: typeof EVENTS.RENDER_TAB_ICON, callback: (leaf: WorkspaceLeaf, iconEl: HTMLElement, tabEl: HTMLElement) => void): EventRef;
		on(name: typeof EVENTS.RENDER_GROUP_ICON, callback: (group: WorkspaceParent, iconEl: HTMLElement, groupEl: HTMLElement) => void): EventRef;
		on(name: typeof EVENTS.REQUEST_ICON_REFRESH, callback: () => void): EventRef;
		on(name: typeof EVENTS.ON_TAB_MENU, callback: (menu: Menu, leaf: WorkspaceLeaf) => void): EventRef;
		on(name: typeof EVENTS.ON_TABS_MENU, callback: (menu: Menu, leaves: WorkspaceLeaf[]) => void): EventRef;
		on(name: typeof EVENTS.ON_GROUP_MENU, callback: (menu: Menu, group: WorkspaceParent) => void): EventRef;
	}

	interface WorkspaceLeaf {
		on(name: typeof EVENTS.EPHEMERAL_TOGGLE, callback: (isEphemeral: boolean) => void): EventRef;
	}

	interface WorkspaceParent {
		on(name: typeof EVENTS.GROUP_VIEW_CHANGE, callback: (viewType: GroupViewType) => void): EventRef;
	}
}
