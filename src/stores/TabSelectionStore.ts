import { create } from "zustand";
import { Identifier } from "src/models/VTWorkspace";
import { tabCacheStore } from "./TabCacheStore";

interface TabSelectionState {
	selectedTabs: Set<Identifier>;
	lastSelectedTab: Identifier | null;
}

interface TabSelectionActions {
	toggleTabSelection: (id: Identifier, isMultiSelect: boolean) => void;
	selectTabRange: (from: Identifier, to: Identifier) => void;
	clearTabSelection: () => void;
	isTabSelected: (id: Identifier) => boolean;
	getSelectedTabs: () => Identifier[];
	hasSelectedTabs: () => boolean;
}

type TabSelectionStore = TabSelectionState & TabSelectionActions;

export const useTabSelection = create<TabSelectionStore>()((set, get) => ({
	selectedTabs: new Set(),
	lastSelectedTab: null,
	toggleTabSelection: (id: Identifier, isMultiSelect: boolean) => {
		set((state) => {
			const newSelectedTabs = new Set(state.selectedTabs);
			if (isMultiSelect) {
				if (newSelectedTabs.has(id)) {
					newSelectedTabs.delete(id);
				} else {
					newSelectedTabs.add(id);
				}
			} else {
				newSelectedTabs.clear();
				newSelectedTabs.add(id);
			}
			return {
				selectedTabs: newSelectedTabs,
				lastSelectedTab: id,
			};
		});
	},
	selectTabRange: (from: Identifier, to: Identifier) => {
		const allTabsInOrder = tabCacheStore.getState().leafIDs;
		set(() => {
			const newSelectedTabs = new Set<Identifier>();
			const fromIndex = allTabsInOrder.indexOf(from);
			const toIndex = allTabsInOrder.indexOf(to);
			if (fromIndex !== -1 && toIndex !== -1) {
				const start = Math.min(fromIndex, toIndex);
				const end = Math.max(fromIndex, toIndex);
				for (let i = start; i <= end; i++) {
					const tab = allTabsInOrder[i];
					if (tab !== undefined) newSelectedTabs.add(tab);
				}
			}
			return {
				selectedTabs: newSelectedTabs,
				lastSelectedTab: to,
			};
		});
	},
	clearTabSelection: () => {
		set({ selectedTabs: new Set(), lastSelectedTab: null });
	},
	isTabSelected: (id: Identifier) => get().selectedTabs.has(id),
	getSelectedTabs: () => Array.from(get().selectedTabs),
	hasSelectedTabs: () => get().selectedTabs.size > 0,
}));
