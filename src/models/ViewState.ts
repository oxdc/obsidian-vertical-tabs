import { create } from "zustand";
import { DefaultRecord } from "src/utils/DefaultRecord";
import {
	App,
	EventRef,
	ItemView,
	Platform,
	WorkspaceLeaf,
	WorkspaceParent,
} from "obsidian";
import ObsidianVerticalTabs from "src/main";
import {
	getFrameStyle,
	hasControlButtonsOnTheLeft,
	hasControlButtonsOnTheRight,
	isRibbonVisible,
	WindowFrameStyle,
} from "src/services/WindowFrame";
import {
	hasLeftSidebarToggle,
	hasRightSidebarToggle,
	insertLeftSidebarToggle,
	insertRightSidebarToggle,
} from "src/services/SidebarToggles";
import { Identifier } from "./VTWorkspace";

export const DEFAULT_GROUP_TITLE = "Grouped tabs";
const factory = () => DEFAULT_GROUP_TITLE;

export type GroupTitles = DefaultRecord<Identifier, string>;
export const createNewGroupTitles = () =>
	new DefaultRecord(factory) as GroupTitles;

export type PinningEvents = DefaultRecord<Identifier, EventRef | null>;
export type PinningEventCallback = (pinned: boolean) => void;
export const createNewPinningEvents = () =>
	new DefaultRecord(() => null) as PinningEvents;

interface ViewState {
	groupTitles: GroupTitles;
	hiddenGroups: Array<Identifier>;
	latestActiveLeaf: WorkspaceLeaf | null;
	pinningEvents: PinningEvents;
	globalCollapseState: boolean;
	clear: () => void;
	setGroupTitle: (id: Identifier, name: string) => void;
	toggleHiddenGroup: (id: Identifier, isHidden: boolean) => void;
	setLatestActiveLeaf: (
		plugin: ObsidianVerticalTabs,
		leaf?: WorkspaceLeaf | null
	) => void;
	lockFocus: (plugin: ObsidianVerticalTabs) => void;
	lockFocusOnLeaf: (app: App, leaf: WorkspaceLeaf) => void;
	resetFocusFlags: () => void;
	leftButtonClone: HTMLElement | null;
	rightButtonClone: HTMLElement | null;
	topLeftContainer: Element | null;
	topRightContainer: Element | null;
	topRightMainContainer: Element | null;
	cloneToggleButtons: (app: App) => void;
	removeCloneButtons: () => void;
	insertCloneButtons: () => void;
	updatePositionLabels: () => void;
	refreshToggleButtons: (app: App) => void;
	bindPinningEvent: (
		leaf: WorkspaceLeaf,
		callback: PinningEventCallback
	) => void;
	unbindPinningEvent: (leaf: WorkspaceLeaf) => void;
	setAllCollapsed: () => void;
	setAllExpanded: () => void;
}

const saveViewState = (titles: GroupTitles) => {
	const data = Array.from(titles.entries());
	localStorage.setItem("view-state", JSON.stringify(data));
};

const loadViewState = (): GroupTitles | null => {
	const data = localStorage.getItem("view-state");
	if (!data) return null;
	const entries = JSON.parse(data) as [Identifier, string][];
	return new DefaultRecord(factory, entries);
};

const saveHiddenGroups = (hiddenGroups: Array<Identifier>) => {
	localStorage.setItem("hidden-groups", JSON.stringify(hiddenGroups));
};

const loadHiddenGroups = (): Array<Identifier> => {
	const data = localStorage.getItem("hidden-groups");
	if (!data) return [];
	return JSON.parse(data);
};

const getCornerContainers = (tabContainers: Array<Element>) => {
	const visibleTabContainers = tabContainers.filter(
		(tabContainer) =>
			tabContainer.clientHeight > 0 && tabContainer.clientWidth > 0
	);
	const x = visibleTabContainers.map(
		(tabContainer) => tabContainer.getBoundingClientRect().x
	);
	const y = visibleTabContainers.map(
		(tabContainer) => tabContainer.getBoundingClientRect().y
	);
	const xMin = Math.min(...x);
	const yMin = Math.min(...y);
	const xMax = Math.max(...x);
	const topLeftContainer = visibleTabContainers.find(
		(tabContainer) =>
			tabContainer.getBoundingClientRect().x === xMin &&
			tabContainer.getBoundingClientRect().y === yMin
	);
	const topRightContainer = visibleTabContainers.find(
		(tabContainer) =>
			tabContainer.getBoundingClientRect().x === xMax &&
			tabContainer.getBoundingClientRect().y === yMin
	);
	return { topLeftContainer, topRightContainer };
};

export const useViewState = create<ViewState>()((set, get) => ({
	groupTitles: loadViewState() ?? createNewGroupTitles(),
	hiddenGroups: loadHiddenGroups(),
	latestActiveLeaf: null,
	pinningEvents: createNewPinningEvents(),
	globalCollapseState: false,
	leftButtonClone: null,
	rightButtonClone: null,
	topLeftContainer: null,
	topRightContainer: null,
	topRightMainContainer: null,
	clear: () => set({ groupTitles: createNewGroupTitles() }),
	setGroupTitle: (id: Identifier, name: string) =>
		set((state) => {
			state.groupTitles.set(id, name);
			saveViewState(state.groupTitles);
			return state;
		}),
	toggleHiddenGroup: (id: Identifier, isHidden: boolean) => {
		if (isHidden) {
			set((state) => ({ hiddenGroups: [...state.hiddenGroups, id] }));
		} else {
			set((state) => ({
				hiddenGroups: state.hiddenGroups.filter((gid) => gid !== id),
			}));
		}
		saveHiddenGroups(get().hiddenGroups);
	},
	setLatestActiveLeaf(plugin: ObsidianVerticalTabs) {
		const workspace = plugin.app.workspace;
		const activeView = workspace.getActiveViewOfType(ItemView);
		if (!activeView) {
			// Focus has already been moved, try our best to lock it back
			get().lockFocus(plugin);
			return;
		}
		const activeLeaf = activeView.leaf;
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
		const workspace = plugin.app.workspace;
		const activeLeaf = get().latestActiveLeaf;
		const isRootLeaf = activeLeaf?.getRoot() === workspace.rootSplit;
		// We should check this again, since the user may have moved or closed the tab
		if (activeLeaf && isRootLeaf) {
			get().lockFocusOnLeaf(plugin.app, activeLeaf);
			return;
		}
		// No active leaf in the RootSplit has been recorded,
		// try to get the first active one in the first group
		const groups: WorkspaceParent[] = [];
		workspace.iterateRootLeaves((leaf) => {
			const group = leaf.parent;
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
	lockFocusOnLeaf(app: App, leaf: WorkspaceLeaf) {
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
	cloneToggleButtons(app: App) {
		const workspace = app.workspace;
		const leftButton = workspace.leftSidebarToggleButtonEl;
		const rightButton = workspace.rightSidebarToggleButtonEl;
		const leftButtonClone = leftButton.cloneNode(true) as HTMLElement;
		const rightButtonClone = rightButton.cloneNode(true) as HTMLElement;
		const { leftSplit, rightSplit } = workspace;
		const onClickLeftButton = () => leftSplit.toggle();
		const onClickRightButton = () => rightSplit.toggle();
		leftButtonClone.classList.add("vt-mod-toggle");
		rightButtonClone.classList.add("vt-mod-toggle");
		leftButtonClone.addEventListener("click", onClickLeftButton);
		rightButtonClone.addEventListener("click", onClickRightButton);
		set({ leftButtonClone, rightButtonClone });
	},
	removeCloneButtons() {
		const { leftButtonClone, rightButtonClone } = get();
		leftButtonClone?.remove();
		rightButtonClone?.remove();
	},
	insertCloneButtons() {
		if (!Platform.isDesktop) return;
		const isFrameHidden = getFrameStyle() === WindowFrameStyle.Hidden;
		if (
			!isRibbonVisible() ||
			(hasControlButtonsOnTheLeft() && isFrameHidden)
		) {
			const { topLeftContainer, leftButtonClone } = get();
			if (!hasLeftSidebarToggle(topLeftContainer))
				insertLeftSidebarToggle(topLeftContainer, leftButtonClone);
		}
		const excludeRightSidebar =
			hasControlButtonsOnTheRight() && isFrameHidden;
		const topRightContainer = excludeRightSidebar
			? get().topRightMainContainer
			: get().topRightContainer;
		const { rightButtonClone } = get();
		if (!hasRightSidebarToggle(topRightContainer))
			insertRightSidebarToggle(topRightContainer, rightButtonClone);
	},
	updatePositionLabels: () => {
		const tabContainers = Array.from(
			document.querySelectorAll(".workspace-tabs")
		);
		tabContainers.forEach((tabContainer) => {
			tabContainer.classList.remove(
				"vt-mod-top-left-space",
				"vt-mod-top-right-space"
			);
		});
		const { topLeftContainer, topRightContainer } =
			getCornerContainers(tabContainers);
		topLeftContainer?.classList.add("vt-mod-top-left-space");
		topRightContainer?.classList.add("vt-mod-top-right-space");
		const excludedRightSidebar = tabContainers.filter(
			(tabContainer) =>
				!tabContainer.parentElement?.hasClass("mod-right-split")
		);
		const topRightMainContainer =
			getCornerContainers(excludedRightSidebar).topRightContainer;
		set({
			topLeftContainer,
			topRightContainer,
			topRightMainContainer,
		});
	},
	refreshToggleButtons(app: App) {
		get().removeCloneButtons();
		get().updatePositionLabels();
		const { leftButtonClone, rightButtonClone } = get();
		if (!leftButtonClone || !rightButtonClone)
			get().cloneToggleButtons(app);
		get().insertCloneButtons();
	},
	bindPinningEvent(leaf: WorkspaceLeaf, callback: (pinned: boolean) => void) {
		const { pinningEvents } = get();
		const event = pinningEvents.get(leaf.id);
		if (event) return;
		const newEvent = leaf.on("pinned-change", callback);
		pinningEvents.set(leaf.id, newEvent);
		set({ pinningEvents });
	},
	unbindPinningEvent(leaf: WorkspaceLeaf) {
		const { pinningEvents } = get();
		const event = pinningEvents.get(leaf.id);
		if (event) {
			leaf.offref(event);
			pinningEvents.set(leaf.id, null);
			set({ pinningEvents });
		}
	},
	setAllCollapsed() {
		set({ globalCollapseState: true });
	},
	setAllExpanded() {
		set({ globalCollapseState: false });
	},
}));
