import { create } from "zustand";
import { DefaultRecord } from "src/utils/DefaultRecord";
import {
	App,
	debounce,
	EventRef,
	ItemView,
	Platform,
	Workspace,
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
import { getGroupType, GroupType, Identifier } from "./VTWorkspace";
import { REFRESH_TIMEOUT_LONG, useTabCache } from "./TabCache";
import { pinDrawer, unpinDrawer } from "src/services/MobileDrawer";
import { CommandCheckCallback, getCommandByName } from "src/services/Commands";

export const DEFAULT_GROUP_TITLE = "Grouped tabs";
const factory = () => DEFAULT_GROUP_TITLE;

export type GroupTitles = DefaultRecord<Identifier, string>;
export const createNewGroupTitles = () =>
	new DefaultRecord(factory) as GroupTitles;

export type PinningEvents = DefaultRecord<Identifier, EventRef | null>;
export type PinningEventCallback = (pinned: boolean) => void;
export const createNewPinningEvents = () =>
	new DefaultRecord(() => null) as PinningEvents;

export type EphermalToggleEvents = DefaultRecord<Identifier, EventRef | null>;
export type EphermalToggleEventCallback = (isEphemeral: boolean) => void;
export const createNewEphermalToggleEvents = () =>
	new DefaultRecord(() => null) as EphermalToggleEvents;

export type ViewCueIndex = number | string | undefined;
export const MIN_INDEX_KEY = 1;
export const MAX_INDEX_KEY = 8;
export const LAST_INDEX_KEY = 9;
export const VIEW_CUE_NEXT = "→";
export const VIEW_CUE_PREV = "←";
export const VIEW_CUE_DELAY = 600;
export type ViewCueNativeCallback = CommandCheckCallback;
export type ViewCueNativeCallbackMap = Map<number, ViewCueNativeCallback>;
export type ViewCueFirstTabs = DefaultRecord<Identifier, HTMLElement | null>;
export const createNewViewCueFirstTabs = () =>
	new DefaultRecord(() => null) as ViewCueFirstTabs;

interface ViewState {
	groupTitles: GroupTitles;
	hiddenGroups: Array<Identifier>;
	collapsedGroups: Array<Identifier>;
	nonEphemeralTabs: Array<Identifier>;
	latestActiveLeaf: WorkspaceLeaf | null;
	latestActiveTab: HTMLElement | null;
	pinningEvents: PinningEvents;
	ephermalToggleEvents: EphermalToggleEvents;
	globalCollapseState: boolean;
	isEditingTabs: boolean;
	hasCtrlKeyPressed: boolean;
	viewCueOffset: number;
	viewCueNativeCallbacks: ViewCueNativeCallbackMap;
	viewCueFirstTabs: ViewCueFirstTabs;
	clear: () => void;
	setGroupTitle: (id: Identifier, name: string) => void;
	toggleCollapsedGroup: (id: Identifier, isCollapsed: boolean) => void;
	toggleHiddenGroup: (id: Identifier, isHidden: boolean) => void;
	rememberNonephemeralTab: (app: App, id: Identifier) => void;
	forgetNonephemeralTabs: () => void;
	setLatestActiveLeaf: (
		plugin: ObsidianVerticalTabs,
		leaf?: WorkspaceLeaf | null
	) => void;
	lockFocus: (plugin: ObsidianVerticalTabs) => void;
	lockFocusOnLeaf: (app: App, leaf: WorkspaceLeaf) => void;
	resetFocusFlags: () => void;
	hookLatestActiveTab: (tab: HTMLElement | null) => void;
	scorllToActiveTab: () => void;
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
	bindEphemeralToggleEvent: (
		app: App,
		leaf: WorkspaceLeaf,
		callback: EphermalToggleEventCallback
	) => void;
	unbindEphemeralToggleEvent: (leaf: WorkspaceLeaf) => void;
	setAllCollapsed: () => void;
	setAllExpanded: () => void;
	uncollapseActiveGroup: (app: App) => void;
	executeSmartNavigation: (
		app: App,
		target: WorkspaceLeaf,
		fallback: () => boolean
	) => boolean;
	checkIfGroupChanged: (
		workspace: Workspace,
		oldLeaf: WorkspaceLeaf | null,
		newLeaf: WorkspaceLeaf | null
	) => boolean;
	setIsEditingTabs: (app: App, isEditing: boolean) => void;
	setCtrlKeyState: (isPressed: boolean) => void;
	increaseViewCueOffset: () => void;
	decreaseViewCueOffset: () => void;
	resetViewCueOffset: () => void;
	mapViewCueIndex(realIndex?: number, isLast?: boolean): ViewCueIndex;
	convertBackToRealIndex(
		userIndex: number,
		numOfLeaves: number
	): number | null;
	revealTabOfUserIndex: (
		app: App,
		userIndex: number,
		checking: boolean
	) => boolean | void;
	modifyViewCueCallback: (app: App) => void;
	resetViewCueCallback: (app: App) => void;
	registerViewCueTab: (
		leaf: WorkspaceLeaf,
		tab: HTMLElement | null,
		isFirst: boolean
	) => void;
	scorllToViewCueFirstTab: (app: App) => void;
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

const saveCollapsedGroups = (collapsedGroups: Array<Identifier>) => {
	localStorage.setItem("collapsed-groups", JSON.stringify(collapsedGroups));
};

const loadCollapsedGroups = (): Array<Identifier> => {
	const data = localStorage.getItem("collapsed-groups");
	if (!data) return [];
	return JSON.parse(data);
};

const saveNonEphemeralTabs = (tabs: Array<Identifier>) => {
	localStorage.setItem("nonephemeral-tabs", JSON.stringify(Array.from(tabs)));
};

const loadNonEphemeralTabs = (): Array<Identifier> => {
	const data = localStorage.getItem("nonephemeral-tabs");
	if (!data) return [];
	return JSON.parse(data);
};

const clearNonEphemeralTabs = () => {
	localStorage.removeItem("nonephemeral-tabs");
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
	collapsedGroups: loadCollapsedGroups(),
	nonEphemeralTabs: loadNonEphemeralTabs(),
	latestActiveLeaf: null,
	latestActiveTab: null,
	pinningEvents: createNewPinningEvents(),
	ephermalToggleEvents: createNewEphermalToggleEvents(),
	globalCollapseState: false,
	isEditingTabs: false,
	hasCtrlKeyPressed: false,
	viewCueOffset: 0,
	viewCueNativeCallbacks: new Map(),
	viewCueFirstTabs: createNewViewCueFirstTabs(),
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
	toggleCollapsedGroup: (id: Identifier, isCollapsed: boolean) => {
		if (isCollapsed) {
			set((state) => ({
				collapsedGroups: [...state.collapsedGroups, id],
			}));
		} else {
			set((state) => ({
				collapsedGroups: state.collapsedGroups.filter(
					(gid) => gid !== id
				),
				globalCollapseState: false,
			}));
		}
		saveCollapsedGroups(get().collapsedGroups);
	},
	rememberNonephemeralTab(app: App, id: Identifier) {
		const { nonEphemeralTabs } = get();
		if (nonEphemeralTabs.contains(id)) return;
		const newList = nonEphemeralTabs.filter(
			(id) => app.workspace.getLeafById(id) !== null
		);
		set({ nonEphemeralTabs: [...newList, id] });
		saveNonEphemeralTabs(get().nonEphemeralTabs);
	},
	forgetNonephemeralTabs() {
		clearNonEphemeralTabs();
		set({ nonEphemeralTabs: [] });
	},
	setLatestActiveLeaf(plugin: ObsidianVerticalTabs) {
		const oldActiveLeaf = get().latestActiveLeaf;
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
		const newActiveLeaf = get().latestActiveLeaf;
		const groupChanged = get().checkIfGroupChanged(
			workspace,
			oldActiveLeaf,
			newActiveLeaf
		);
		// Focus has been moved to another group, we lock on the new group
		if (groupChanged) get().lockFocus(plugin);
	},
	checkIfGroupChanged(
		workspace: Workspace,
		oldLeaf: WorkspaceLeaf | null,
		newLeaf: WorkspaceLeaf | null
	) {
		let changed = false;
		if (oldLeaf === null && newLeaf === null) return false;
		if (oldLeaf === null || newLeaf === null) {
			changed = true;
		} else if (oldLeaf.parent === null || newLeaf.parent === null) {
			changed = true;
		} else if (oldLeaf.parent.id !== newLeaf.parent.id) {
			changed = true;
		}
		if (changed) workspace.trigger("vertical-tabs:update-toggle");
		return changed;
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
	hookLatestActiveTab(tab: HTMLElement | null) {
		if (tab && get().latestActiveLeaf) {
			set({ latestActiveTab: tab });
		} else {
			set({ latestActiveTab: null });
		}
	},
	scorllToActiveTab() {
		const { latestActiveTab } = get();
		if (!latestActiveTab) return;
		latestActiveTab.scrollIntoView({
			behavior: "smooth",
			block: "center",
			inline: "nearest",
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
		if (!Platform.isDesktop && !Platform.isTablet) return;
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
	bindEphemeralToggleEvent(
		app: App,
		leaf: WorkspaceLeaf,
		callback: EphermalToggleEventCallback
	) {
		const { ephermalToggleEvents } = get();
		const event = ephermalToggleEvents.get(leaf.id);
		if (event) return;
		const newEvent = leaf.on("ephemeral-toggle", (isEphemeral) => {
			if (!isEphemeral) get().rememberNonephemeralTab(app, leaf.id);
			callback(isEphemeral);
		});
		ephermalToggleEvents.set(leaf.id, newEvent);
		set({ ephermalToggleEvents });
	},
	unbindEphemeralToggleEvent(leaf: WorkspaceLeaf) {
		const { ephermalToggleEvents } = get();
		const event = ephermalToggleEvents.get(leaf.id);
		if (event) {
			leaf.offref(event);
			ephermalToggleEvents.set(leaf.id, null);
			set({ ephermalToggleEvents });
		}
	},
	setAllCollapsed() {
		const ids = useTabCache.getState().groupIDs;
		set({ globalCollapseState: true, collapsedGroups: ids });
		saveCollapsedGroups(ids);
	},
	setAllExpanded() {
		set({ globalCollapseState: false, collapsedGroups: [] });
		saveCollapsedGroups([]);
	},
	uncollapseActiveGroup(app: App) {
		const { latestActiveLeaf } = get();
		if (!latestActiveLeaf) return;
		const group = latestActiveLeaf.parent;
		if (!group) return;
		const type = getGroupType(app, group);
		const isSidebar =
			type === GroupType.LeftSidebar || type === GroupType.RightSidebar;
		if (isSidebar) return;
		if (!group.id) return;
		get().toggleCollapsedGroup(group.id, false);
		set({ globalCollapseState: false });
	},
	executeSmartNavigation(
		app: App,
		target: WorkspaceLeaf,
		fallback: () => boolean
	) {
		const root = target.getRoot();
		// If the target is in the sidebar, it is not navigatable
		if (
			root === app.workspace.leftSplit ||
			root === app.workspace.rightSplit
		)
			return false;
		const { latestActiveLeaf } = get();
		// If we do not know the latest active leaf, use the default handler
		if (!latestActiveLeaf) return fallback();
		const latestParent = latestActiveLeaf.parent;
		const targetParent = target.parent;
		// If one of the parent is not found, use the default handler
		if (latestParent === null || targetParent === null) return fallback();
		// if the target is not in the same group, it is not navigatable
		if (latestParent.id !== targetParent.id) return false;
		// otherwise, use the default handler
		return fallback();
	},
	setIsEditingTabs(app: App, isEditing: boolean) {
		if (Platform.isMobile) {
			if (isEditing) {
				pinDrawer(app);
			} else {
				unpinDrawer(app);
			}
		}
		set({ isEditingTabs: isEditing });
	},
	setCtrlKeyState(isPressed: boolean) {
		set({ hasCtrlKeyPressed: isPressed });
		if (!isPressed) get().resetViewCueOffset();
	},
	increaseViewCueOffset: debounce(() => {
		const { viewCueOffset, latestActiveLeaf } = get();
		if (latestActiveLeaf) {
			const latestParent = latestActiveLeaf.parent;
			const numOfLeaves = latestParent.children.length;
			const maxOffset = Math.floor((numOfLeaves - 1) / MAX_INDEX_KEY);
			set({ viewCueOffset: Math.min(maxOffset, viewCueOffset + 1) });
		} else {
			set({ viewCueOffset: viewCueOffset + 1 });
		}
	}, REFRESH_TIMEOUT_LONG),
	decreaseViewCueOffset: debounce(() => {
		const { viewCueOffset } = get();
		set({ viewCueOffset: Math.max(0, viewCueOffset - 1) });
	}, REFRESH_TIMEOUT_LONG),
	resetViewCueOffset() {
		set({ viewCueOffset: 0 });
	},
	mapViewCueIndex(realIndex?: number, isLast?: boolean): ViewCueIndex {
		if (realIndex === undefined) return undefined;
		const { viewCueOffset } = get();
		const userIndex = realIndex - viewCueOffset * MAX_INDEX_KEY;
		if (MIN_INDEX_KEY <= userIndex && userIndex <= MAX_INDEX_KEY) {
			return userIndex;
		} else if (isLast) {
			return LAST_INDEX_KEY;
		} else if (userIndex === MAX_INDEX_KEY + 1) {
			return VIEW_CUE_NEXT;
		} else if (userIndex === MIN_INDEX_KEY - 1) {
			return VIEW_CUE_PREV;
		}
	},
	convertBackToRealIndex(
		userIndex: number,
		numOfLeaves: number
	): number | null {
		const { viewCueOffset } = get();
		const realIndex = userIndex + viewCueOffset * MAX_INDEX_KEY;
		if (MIN_INDEX_KEY <= realIndex && realIndex <= numOfLeaves) {
			return realIndex;
		} else {
			return null;
		}
	},
	revealTabOfUserIndex(
		app: App,
		userIndex: number,
		checking: boolean
	): boolean | void {
		const { latestActiveLeaf, viewCueNativeCallbacks } = get();
		if (latestActiveLeaf) {
			const latestParent = latestActiveLeaf.parent;
			const numOfLeaves = latestParent.children.length;
			const realIndex = get().convertBackToRealIndex(
				userIndex,
				numOfLeaves
			);
			if (!realIndex) return;
			const target = latestParent.children[realIndex - 1];
			if (!target) return;
			if (checking) return true;
			set({ latestActiveLeaf: target });
			app.workspace.setActiveLeaf(target, { focus: true });
		} else {
			const defaultCallback = viewCueNativeCallbacks.get(userIndex);
			if (defaultCallback) return defaultCallback(checking);
		}
	},
	modifyViewCueCallback(app: App) {
		const nativeCallbacks: ViewCueNativeCallbackMap = new Map();
		for (let index = 1; index < MAX_INDEX_KEY; index++) {
			const commandName = `workspace:goto-tab-${index}`;
			const command = getCommandByName(app, commandName);
			const callback = command?.checkCallback;
			if (command && callback) {
				nativeCallbacks.set(index, callback);
				command.checkCallback = (checking: boolean) => {
					return get().revealTabOfUserIndex(app, index, checking);
				};
			}
		}
		set({ viewCueNativeCallbacks: nativeCallbacks });
	},
	resetViewCueCallback(app: App) {
		const { viewCueNativeCallbacks } = get();
		for (const [index, callback] of viewCueNativeCallbacks) {
			const commandName = `workspace:goto-tab-${index}`;
			const command = getCommandByName(app, commandName);
			if (command) {
				command.checkCallback = callback;
			}
		}
	},
	registerViewCueTab(
		leaf: WorkspaceLeaf,
		tab: HTMLElement | null,
		isFirst: boolean
	) {
		const { viewCueFirstTabs } = get();
		if (isFirst && tab) viewCueFirstTabs.set(leaf.id, tab);
		else viewCueFirstTabs.delete(leaf.id);
		set({ viewCueFirstTabs });
	},
	scorllToViewCueFirstTab(app: App) {
		const { latestActiveLeaf, viewCueFirstTabs } = get();
		let targetTab: HTMLElement | null = null;
		if (!latestActiveLeaf && viewCueFirstTabs.size === 1) {
			// If latestActiveLeaf is not set and viewCueFirstTabs has only one entry,
			// we should scroll to that tab
			targetTab = viewCueFirstTabs.values().next().value;
		} else if (latestActiveLeaf) {
			// If latestActiveLeaf is set, we should scroll to the tab that has the
			// same parent as the latestActiveLeaf
			const activeGroup = latestActiveLeaf.parent;
			if (!activeGroup) return;
			for (const [id, tab] of viewCueFirstTabs) {
				const leaf = app.workspace.getLeafById(id);
				if (!leaf || !tab || !leaf.parent) continue;
				if (activeGroup.id === leaf.parent.id) {
					targetTab = tab;
					break;
				}
			}
		}
		if (targetTab) {
			targetTab.scrollIntoView({
				behavior: "smooth",
				block: "start",
				inline: "nearest",
			});
		}
	},
}));
