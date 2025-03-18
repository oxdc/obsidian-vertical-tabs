import {
	WorkspaceLeaf,
	WorkspaceParent,
	App,
	WorkspaceSplit,
	WorkspaceRoot,
	WorkspaceSidedock,
	WorkspaceMobileDrawer,
} from "obsidian";
import { GroupType, Identifier } from "src/models/VTWorkspace";
import { getGroupType } from "src/models/VTWorkspace";
import { SortStrategy, sortStrategies, sortTabs } from "src/services/SortTabs";
import { useStoreWithActions } from "src/models/StoreWithActions";
import { managedLeafStore } from "src/stores/ManagedLeafStore";
import {
	getSortStrategy,
	setSortStrategy,
	getGroupOrder,
	setGroupOrder,
} from "src/history/Migration";
import { PersistenceManager } from "src/models/PersistenceManager";

export interface GroupState {
	collapsed: boolean;
	title: string;
	color: string | null;
	icon: string | null;
}

export class ExtendedTab {
	readonly instance: WorkspaceLeaf;

	constructor(app: App, leaf: WorkspaceLeaf) {
		this.instance = leaf;
		// If guessedCreationTime is not set, we assume the leaf was created now
		if (!leaf.guessedCreationTime) {
			leaf.guessedCreationTime = Date.now();
		}
	}
}

export class ExtendedGroup {
	readonly instance: WorkspaceParent;
	readonly groupType: GroupType;
	private _state: GroupState;

	constructor(app: App, group: WorkspaceParent, savedState?: GroupState) {
		this.instance = group;
		this.groupType = getGroupType(app, group);
		this._state = {
			collapsed: false,
			title: "Group",
			color: null,
			icon: null,
			...savedState,
		};
	}

	getState(): GroupState {
		return { ...this._state };
	}

	setState(newState: Partial<GroupState>) {
		this._state = { ...this._state, ...newState };
	}

	get tabs(): Identifier[] {
		return this.instance.children.map((child) => child.id);
	}

	toJSON(): GroupState {
		return { ...this._state };
	}
}

export type TabCache = Map<Identifier, ExtendedTab>;
export type GroupCache = Map<Identifier, ExtendedGroup>;

export interface TabCacheState {
	tabs: TabCache;
	groups: GroupCache;
	groupOrder: Identifier[];
	sortStrategy: SortStrategy | null;
	stateVersion: number;
}

export interface TabCacheActions {
	refresh: (app: App, persistenceManager: PersistenceManager) => void;
	swapGroup: (
		source: Identifier,
		target: Identifier,
		persistenceManager: PersistenceManager
	) => void;
	moveGroupToEnd: (
		groupID: Identifier,
		persistenceManager: PersistenceManager
	) => void;
	setSortStrategy: (strategy: SortStrategy | null) => void;
	sort: () => void;
	hasOnlyOneGroup: () => boolean;
	setGroupState: (groupId: Identifier, state: Partial<GroupState>) => void;
	setAllGroupsCollapsed: (collapsed: boolean) => void;
	saveGroupStates: (persistenceManager: PersistenceManager) => Promise<void>;
	loadGroupStates: (
		persistenceManager: PersistenceManager
	) => Record<string, GroupState>;
}

export type TabCacheStore = TabCacheState & {
	actions: TabCacheActions;
};

function getTabs(
	app: App,
	existingTabs: TabCache,
	existingGroups: GroupCache,
	savedStates: Record<Identifier, GroupState>
): { tabs: TabCache; groups: GroupCache } {
	const { isManagedLeaf } = managedLeafStore.getActions();

	const tabs: TabCache = new Map(existingTabs);
	const groups: GroupCache = new Map(existingGroups);

	const activeTabIDs = new Set<Identifier>();
	const activeGroupIDs = new Set<Identifier>();

	const workspace = app.workspace;

	const recordTab = (leaf: WorkspaceLeaf) => {
		if (isManagedLeaf(app, leaf)) return;
		const group = leaf.parent;

		const tabId = leaf.id;
		const groupId = group.id;

		activeTabIDs.add(tabId);
		activeGroupIDs.add(groupId);

		const existingTab = tabs.get(tabId);
		if (!existingTab || existingTab.instance !== leaf) {
			tabs.set(tabId, new ExtendedTab(app, leaf));
		}

		const existingGroup = groups.get(groupId);
		if (!existingGroup || existingGroup.instance !== group) {
			groups.set(
				groupId,
				new ExtendedGroup(app, group, savedStates[groupId])
			);
		}
	};

	const processSplit = (
		split:
			| WorkspaceSplit
			| WorkspaceRoot
			| WorkspaceSidedock
			| WorkspaceMobileDrawer
	) => {
		workspace.iterateLeaves(split as WorkspaceSplit, recordTab);
	};

	processSplit(workspace.leftSplit as WorkspaceSplit);
	processSplit(workspace.rightSplit as WorkspaceSplit);
	processSplit(workspace.rootSplit as WorkspaceRoot);
	processSplit(workspace.floatingSplit as WorkspaceSplit);

	for (const [id] of tabs) {
		if (!activeTabIDs.has(id)) tabs.delete(id);
	}

	for (const [id] of groups) {
		if (!activeGroupIDs.has(id)) groups.delete(id);
	}

	return { tabs, groups };
}

export const tabCacheStore = useStoreWithActions<TabCacheStore>((set, get) => ({
	tabs: new Map(),
	groups: new Map(),
	groupOrder: [],
	sortStrategy: null,
	stateVersion: 0,
	actions: {
		refresh: (app, persistenceManager) => {
			const {
				tabs: existingTabs,
				groups: existingGroups,
				groupOrder: existingGroupOrder,
				sortStrategy: existingSortStrategy,
			} = get();

			// Use empty object as default if loading fails
			const savedStates =
				get().actions.loadGroupStates(persistenceManager);
			const { tabs, groups } = getTabs(
				app,
				existingTabs,
				existingGroups,
				savedStates
			);
			const groupIDs = Array.from(groups.keys());

			// Preserve existing group order and add new groups at the end
			const existingGroupIDs = existingGroupOrder.filter((id) =>
				groupIDs.includes(id)
			);
			const newGroupIDs = groupIDs.filter(
				(id) => !existingGroupIDs.includes(id)
			);
			const unsortedGroupIDs = [...existingGroupIDs, ...newGroupIDs];

			// Merge with loaded group order from persistence
			const loadedGroupIDs = getGroupOrder(persistenceManager);

			// First, take groups from loaded order that still exist
			const groupsFromLoadedOrder = loadedGroupIDs.filter((id) =>
				unsortedGroupIDs.includes(id)
			);

			// Then, add any new groups that weren't in loaded order
			const newlyAddedGroups = unsortedGroupIDs.filter(
				(id) => !loadedGroupIDs.includes(id)
			);

			// Combine them to preserve loaded order and append new groups
			const sortedGroupIDs: Identifier[] = [
				...groupsFromLoadedOrder,
				...newlyAddedGroups,
			];

			// Update persistence and determine sort strategy
			setGroupOrder(persistenceManager, sortedGroupIDs);
			const sortStrategy =
				existingSortStrategy ||
				sortStrategies[getSortStrategy()] ||
				null;

			set({
				tabs,
				groups,
				groupOrder: sortedGroupIDs,
				sortStrategy,
				stateVersion: get().stateVersion + 1,
			});

			// Save states after refresh
			get()
				.actions.saveGroupStates(persistenceManager)
				.catch(console.error);
		},
		swapGroup: (source, target, persistenceManager) => {
			const { groupOrder } = get();
			const sourceIndex = groupOrder.indexOf(source);
			const targetIndex = groupOrder.indexOf(target);
			const newGroupOrder = [...groupOrder];
			newGroupOrder[sourceIndex] = target;
			newGroupOrder[targetIndex] = source;
			set({ groupOrder: newGroupOrder });
			setGroupOrder(persistenceManager, newGroupOrder);
		},
		moveGroupToEnd: (groupID, persistenceManager) => {
			const { groupOrder } = get();
			const newGroupOrder = [...groupOrder];
			const index = newGroupOrder.indexOf(groupID);
			newGroupOrder.splice(index, 1);
			newGroupOrder.push(groupID);
			set({ groupOrder: newGroupOrder });
			setGroupOrder(persistenceManager, newGroupOrder);
		},
		setSortStrategy: (strategy) => {
			setSortStrategy(strategy ? strategy.toString() : "none");
			set({ sortStrategy: strategy });
			get().actions.sort();
		},
		sort: () => {
			const { groups, sortStrategy } = get();
			if (!sortStrategy) return;
			for (const group of groups.values()) {
				if (group.groupType === GroupType.RootSplit) {
					sortTabs(group.instance, sortStrategy);
				}
			}
		},
		hasOnlyOneGroup: () => {
			const { groups } = get();
			const rootGroup = Array.from(groups.values()).filter(
				(group) => group.groupType === GroupType.RootSplit
			);
			return rootGroup.length === 1;
		},
		setGroupState: (groupId: Identifier, newState: Partial<GroupState>) => {
			const { groups } = get();
			const group = groups.get(groupId);
			if (group) {
				group.setState(newState);
				set((state) => ({ stateVersion: state.stateVersion + 1 }));
			}
		},
		setAllGroupsCollapsed: (collapsed: boolean) => {
			const { groups } = get();
			for (const group of groups.values()) {
				group.setState({ collapsed });
			}
			set((state) => ({ stateVersion: state.stateVersion + 1 }));
		},
		saveGroupStates: async (persistenceManager: PersistenceManager) => {
			const { groups } = get();
			const states = new Map<Identifier, GroupState>();
			for (const [id, group] of groups.entries()) {
				states.set(id, group.toJSON());
			}
			await persistenceManager.instance.set(
				"groupStates",
				Object.fromEntries(states)
			);
		},
		loadGroupStates: (
			persistenceManager: PersistenceManager
		): Record<string, GroupState> => {
			try {
				// Use synchronous local storage or in-memory cache if available
				const cachedData =
					persistenceManager.instance.get<Record<string, GroupState>>(
						"groupStates"
					);
				return cachedData ?? {};
			} catch (error) {
				console.error("Failed to load group states:", error);
				return {};
			}
		},
	},
}));
