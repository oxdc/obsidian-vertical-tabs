import { WorkspaceLeaf, WorkspaceParent, App, WorkspaceSplit } from "obsidian";
import { GroupType, Identifier } from "src/models/VTWorkspace";
import { getGroupType } from "src/models/VTWorkspace";
import { SortStrategy, sortTabs } from "src/services/SortTabs";
import { useStoreWithActions } from "src/models/StoreWithActions";
import { managedLeafStore } from "src/stores/ManagedLeafStore";
import {
	getSortStrategy,
	setSortStrategy,
	getGroupOrder,
	setGroupOrder,
} from "src/history/Migration";
import { PersistenceManager } from "src/models/PersistenceManager";

export class VTTab {
	readonly instance: WorkspaceLeaf;

	constructor(app: App, leaf: WorkspaceLeaf) {
		this.instance = leaf;
		// If guessedCreationTime is not set, we assume the leaf was created now
		if (!leaf.guessedCreationTime) {
			leaf.guessedCreationTime = Date.now();
		}
	}
}

export class VTGroup {
	readonly instance: WorkspaceParent;
	readonly groupType: GroupType;

	constructor(app: App, group: WorkspaceParent) {
		this.instance = group;
		this.groupType = getGroupType(app, group);
	}

	get tabs(): Identifier[] {
		return this.instance.children.map((child) => child.id);
	}
}

export type TabCache = Map<Identifier, VTTab>;
export type GroupCache = Map<Identifier, VTGroup>;

export interface TabCacheState {
	tabs: TabCache;
	groups: GroupCache;
	groupOrder: Identifier[];
	sortStrategy: SortStrategy | null;
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
}

export type TabCacheStore = TabCacheState & {
	actions: TabCacheActions;
};

function getTabs(
	app: App,
	existingTabs: TabCache,
	existingGroups: GroupCache
): { tabs: TabCache; groups: GroupCache } {
	const { isManagedLeaf } = managedLeafStore.getActions();
	const tabs: TabCache = new Map(existingTabs);
	const groups: GroupCache = new Map(existingGroups);
	const workspace = app.workspace;
	const { leftSplit, rightSplit, rootSplit, floatingSplit } = workspace;
	const activeTabIDs = new Set<Identifier>();
	const activeGroupIDs = new Set<Identifier>();

	const recordTab = (
		leaf: WorkspaceLeaf,
		group: WorkspaceParent,
		groupType: GroupType
	) => {
		if (isManagedLeaf(app, leaf)) return;

		const tabId = leaf.id;
		activeTabIDs.add(tabId);
		const existingTab = tabs.get(tabId);
		if (existingTab) {
			if (existingTab.instance !== leaf) {
				tabs.set(tabId, new VTTab(app, leaf));
			}
		} else {
			tabs.set(tabId, new VTTab(app, leaf));
		}

		const groupId =
			groupType === GroupType.LeftSidebar
				? "left-sidebar"
				: groupType === GroupType.RightSidebar
				? "right-sidebar"
				: group.id;

		activeGroupIDs.add(groupId);
		const existingGroup = groups.get(groupId);
		if (existingGroup) {
			if (existingGroup.instance !== group) {
				const newGroup = new VTGroup(app, group);
				groups.set(groupId, newGroup);
			}
		} else {
			const newGroup = new VTGroup(app, group);
			groups.set(groupId, newGroup);
		}
	};

	workspace.iterateLeaves(leftSplit as WorkspaceSplit, (leaf) =>
		recordTab(leaf, leaf.parent as WorkspaceParent, GroupType.LeftSidebar)
	);
	workspace.iterateLeaves(rightSplit as WorkspaceSplit, (leaf) =>
		recordTab(leaf, leaf.parent as WorkspaceParent, GroupType.RightSidebar)
	);
	workspace.iterateLeaves(rootSplit, (leaf) =>
		recordTab(leaf, leaf.parent as WorkspaceParent, GroupType.RootSplit)
	);
	workspace.iterateLeaves(floatingSplit, (leaf) =>
		recordTab(leaf, leaf.parent as WorkspaceParent, GroupType.RootSplit)
	);

	for (const [tabId] of tabs) {
		if (!activeTabIDs.has(tabId)) {
			tabs.delete(tabId);
		}
	}

	for (const [groupId] of groups) {
		if (!activeGroupIDs.has(groupId)) {
			groups.delete(groupId);
		}
	}

	return { tabs, groups };
}

export const tabCacheStore = useStoreWithActions<TabCacheStore>((set, get) => ({
	tabs: new Map(),
	groups: new Map(),
	groupOrder: [],
	sortStrategy: null,
	actions: {
		refresh: (app, persistenceManager) => {
			set((state) => {
				const { tabs, groups } = getTabs(app, state.tabs, state.groups);

				// Update group order
				const groupIDs = Array.from(groups.keys());
				const existingGroupIDs = state.groupOrder.filter((id) =>
					groupIDs.includes(id)
				);
				const newGroupIDs = groupIDs.filter(
					(id) => !existingGroupIDs.includes(id)
				);
				const unsortedGroupIDs = [...existingGroupIDs, ...newGroupIDs];

				const loadedGroupIDs = getGroupOrder(persistenceManager);
				const sortedGroupIDs = ([] as Identifier[])
					.concat(loadedGroupIDs)
					.filter((id) => unsortedGroupIDs.includes(id))
					.concat(
						unsortedGroupIDs.filter(
							(id) => !loadedGroupIDs.includes(id)
						)
					);

				setGroupOrder(persistenceManager, sortedGroupIDs);

				const sortStrategy =
					state.sortStrategy ??
					(getSortStrategy() as unknown as SortStrategy);

				return {
					...state,
					tabs,
					groups,
					groupOrder: sortedGroupIDs,
					sortStrategy,
				};
			});
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
			const { groupOrder } = get();
			const rootGroupIDs = groupOrder.filter(
				(id) => !id.endsWith("-sidebar")
			);
			return rootGroupIDs.length === 1;
		},
	},
}));
