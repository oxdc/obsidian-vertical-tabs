import { WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { useStoreWithActions } from "src/models/StoreWithActions";

export type DraggableItem = WorkspaceParent | WorkspaceLeaf;
export type DroppableItem = WorkspaceParent | WorkspaceLeaf | string;

export type DNDManagerState = {
	selectedItems: Array<DraggableItem>;
	overItem: DroppableItem | null;
	isDragging: boolean;
	isEventRegistered: boolean;
};

export type DNDManagerActions = {
	selectOne(item: DraggableItem): boolean;
	selectMany(items: DraggableItem[]): boolean;
	clearSelection(): void;
	isSelectedGroup(): boolean;
	isSelectedLeaf(): boolean;
	setOverItem(item: DroppableItem | null): void;
	setIsDragging(isDragging: boolean): void;
	registerEvent(): void;
};

type DNDManager = DNDManagerState & {
	actions: DNDManagerActions;
};

export const useDNDManager = useStoreWithActions<DNDManager>((set, get) => ({
	selectedItems: [],
	overItem: null,
	isDragging: false,
	isEventRegistered: false,
	actions: {
		selectOne(item: DraggableItem): boolean {
			const { actions } = get();
			let success = true;
			const hasSelectedGroup = actions.isSelectedGroup();
			const hasSelectedLeaf = actions.isSelectedLeaf();
			const selectedItems = new Set<DraggableItem>();
			if (item instanceof String) {
				success = false;
			} else if (!hasSelectedGroup && !hasSelectedLeaf) {
				selectedItems.add(item);
			} else if (hasSelectedGroup && item instanceof WorkspaceParent) {
				selectedItems.add(item);
			} else if (hasSelectedLeaf && item instanceof WorkspaceLeaf) {
				selectedItems.add(item);
			} else {
				success = false;
			}
			if (success) set({ selectedItems: Array.from(selectedItems) });
			return success;
		},
		selectMany(items: DraggableItem[]): boolean {
			const { actions } = get();
			let success = true;
			const hasSelectedGroup = actions.isSelectedGroup();
			const hasSelectedLeaf = actions.isSelectedLeaf();
			const isAllItemsGroup = items.every(
				(item) => item instanceof WorkspaceParent
			);
			const isAllItemsLeaf = items.every(
				(item) => item instanceof WorkspaceLeaf
			);
			const selectedItems = new Set<DraggableItem>();
			if (!hasSelectedGroup && !hasSelectedLeaf) {
				if (isAllItemsGroup || isAllItemsLeaf) {
					items.forEach(selectedItems.add);
				} else {
					success = false;
				}
			} else if (hasSelectedGroup && isAllItemsGroup) {
				items.forEach(selectedItems.add);
			} else if (hasSelectedLeaf && isAllItemsLeaf) {
				items.forEach(selectedItems.add);
			} else {
				success = false;
			}
			if (success) set({ selectedItems: Array.from(selectedItems) });
			return success;
		},
		clearSelection() {
			set({ selectedItems: [] });
		},
		isSelectedGroup() {
			const { selectedItems } = get();
			return (
				selectedItems.length > 0 &&
				selectedItems.every((item) => item instanceof WorkspaceParent)
			);
		},
		isSelectedLeaf() {
			const { selectedItems } = get();
			return (
				selectedItems.length > 0 &&
				selectedItems.every((item) => item instanceof WorkspaceLeaf)
			);
		},
		setOverItem(item: DroppableItem | null) {
			set({ overItem: item });
		},
		setIsDragging(isDragging: boolean) {
			set({ isDragging });
		},
		registerEvent() {
			set({ isEventRegistered: true });
		},
	},
}));

export const DNDManager = useDNDManager;

export const useDNDActions = () => useDNDManager((state) => state.actions);
