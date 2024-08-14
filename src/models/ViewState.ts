import { create } from "zustand";
import * as VT from "./VTWorkspace";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { App, ItemView } from "obsidian";
import ObsidianVerticalTabs from "src/main";

export const DEFAULT_GROUP_TITLE = "Grouped tabs";
const factory = () => DEFAULT_GROUP_TITLE;

export type GroupTitles = DefaultRecord<VT.Identifier, string>;
export const createNewGroupTitles = () =>
	new DefaultRecord(factory) as GroupTitles;

interface ViewState {
	groupTitles: GroupTitles;
	hiddenGroups: Set<VT.Identifier>;
	latestActiveLeaf: VT.WorkspaceLeaf | null;
	clear: () => void;
	setGroupTitle: (id: VT.Identifier, name: string) => void;
	toggleHiddenGroup: (id: VT.Identifier, isHidden: boolean) => void;
	setActiveLeaf: (plugin: ObsidianVerticalTabs) => void;
	lockFocus: (plugin: ObsidianVerticalTabs) => void;
	lockFocusOnLeaf: (app: App, leaf: VT.WorkspaceLeaf) => void;
	resetFocusFlags: () => void;
	insertToggleButtons: (app: App) => void;
}

const saveViewState = (titles: GroupTitles) => {
	const data = Array.from(titles.entries());
	localStorage.setItem("view-state", JSON.stringify(data));
};

const loadViewState = (): GroupTitles | null => {
	const data = localStorage.getItem("view-state");
	if (!data) return null;
	const entries = JSON.parse(data) as [VT.Identifier, string][];
	return new DefaultRecord(factory, entries);
};

const saveHiddenGroups = (hiddenGroups: Set<VT.Identifier>) => {
	const data = Array.from(hiddenGroups);
	localStorage.setItem("hidden-groups", JSON.stringify(data));
};

const loadHiddenGroups = (): Set<VT.Identifier> => {
	const data = localStorage.getItem("hidden-groups");
	if (!data) return new Set();
	return new Set(JSON.parse(data));
};

export const useViewState = create<ViewState>()((set, get) => ({
	groupTitles: loadViewState() ?? createNewGroupTitles(),
	hiddenGroups: loadHiddenGroups(),
	latestActiveLeaf: null,
	clear: () => set({ groupTitles: createNewGroupTitles() }),
	setGroupTitle: (id: VT.Identifier, name: string) =>
		set((state) => {
			state.groupTitles.set(id, name);
			saveViewState(state.groupTitles);
			return state;
		}),
	toggleHiddenGroup: (id: VT.Identifier, isHidden: boolean) =>
		set((state) => {
			if (isHidden) state.hiddenGroups.add(id);
			else state.hiddenGroups.delete(id);
			saveHiddenGroups(state.hiddenGroups);
			return state;
		}),
	setActiveLeaf(plugin: ObsidianVerticalTabs) {
		const workspace = plugin.app.workspace as VT.Workspace;
		const activeView = workspace.getActiveViewOfType(ItemView);
		if (!activeView) {
			// Focus has already been moved, try our best to lock it back
			get().lockFocus(plugin);
			return;
		}
		const activeLeaf = activeView.leaf as VT.WorkspaceLeaf;
		const isRootLeaf = activeLeaf.getRoot() === workspace.rootSplit;
		if (isRootLeaf) {
			set({ latestActiveLeaf: activeLeaf });
		} else {
			// Focus has been moved to sidebars, so we need to move it back
			get().lockFocus(plugin);
		}
	},
	lockFocus(plugin: ObsidianVerticalTabs) {
		// We only need to force focus on the most recent leaf when Zen mode is enabled
		if (!plugin.settings.zenMode) return;
		const workspace = plugin.app.workspace as VT.Workspace;
		const activeLeaf = get().latestActiveLeaf;
		const isRootLeaf = activeLeaf?.getRoot() === workspace.rootSplit;
		// We should check this again, since the user may have moved or closed the tab
		if (activeLeaf && isRootLeaf) {
			get().lockFocusOnLeaf(plugin.app, activeLeaf);
			return;
		}
		// No active leaf in the RootSplit has been recorded,
		// try to get the first active one in the first group
		const groups: VT.WorkspaceParent[] = [];
		workspace.iterateRootLeaves((leaf: VT.WorkspaceLeaf) => {
			const group = leaf.parent as VT.WorkspaceParent;
			if (!groups.includes(group)) groups.push(group);
		});
		if (groups.length > 0) {
			const group = groups[0];
			const activeLeaf = group.children[group.currentTab];
			get().lockFocusOnLeaf(plugin.app, activeLeaf);
			return;
		}
		// No root group has been found, this shall never happen?
	},
	lockFocusOnLeaf(app: App, leaf: VT.WorkspaceLeaf) {
		get().resetFocusFlags();
		const parent = leaf.parent;
		// Focus on the parent group with CSS class
		parent.containerEl.toggleClass("vt-mod-active", true);
		// Force maximize the active leaf in stacked mode
		if (parent.isStacked) {
			parent.setStacked(false);
			parent.setStacked(true);
		}
	},
	resetFocusFlags() {
		document.querySelectorAll(".vt-mod-active").forEach((el) => {
			el.classList.remove("vt-mod-active");
		});
	},
	insertToggleButtons(app: App) {
		const workspace = app.workspace as VT.Workspace;
		const leftButton = workspace.leftSidebarToggleButtonEl;
		const rightButton = workspace.rightSidebarToggleButtonEl;
		const { leftSplit, rightSplit } = workspace;
		const onClickLeftButton = () => leftSplit.toggle();
		const onClickRightButton = () => rightSplit.toggle();
		const tabBars = Array.from(
			document.querySelectorAll(
				".workspace-split.mod-root .workspace-tab-header-container"
			)
		);
		for (const tabBar of tabBars) {
			if (tabBar.querySelector(".vt-mod-toggle.mod-left") === null) {
				const leftButtonClone = leftButton.cloneNode(
					true
				) as HTMLElement;
				leftButtonClone.classList.add("vt-mod-toggle");
				leftButtonClone.addEventListener("click", onClickLeftButton);
				tabBar.prepend(leftButtonClone);
			}
			if (tabBar.querySelector(".vt-mod-toggle.mod-right") === null) {
				const rightButtonClone = rightButton.cloneNode(
					true
				) as HTMLElement;
				rightButtonClone.classList.add("vt-mod-toggle");
				rightButtonClone.addEventListener("click", onClickRightButton);
				tabBar.append(rightButtonClone);
			}
		}
	},
}));
