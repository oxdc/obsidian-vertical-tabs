import { create } from "zustand";
import { Identifier } from "src/models/VTWorkspace";
import { tabCacheStore } from "./TabCacheStore";

interface TabSelectionState {
	selectedTabs: Set<Identifier>;
	lastSelectedTab: Identifier | null;
}

interface TabSelectionActions {
	toggleTabSelection: (tabId: Identifier, isMultiSelect: boolean) => void;
	clearTabSelection: () => void;
	selectTabRange: (fromId: Identifier, toId: Identifier) => void;
	isTabSelected: (tabId: Identifier) => boolean;
	getSelectedTabs: () => Identifier[];
	hasSelectedTabs: () => boolean;
}

type TabSelectionStore = TabSelectionState & TabSelectionActions;

export const useTabSelection = create<TabSelectionStore>()((set, get) => ({
	selectedTabs: new Set(),
	lastSelectedTab: null,

	toggleTabSelection: (tabId: Identifier, isMultiSelect: boolean) => {
		set((state) => {
			const newSelectedTabs = new Set(state.selectedTabs);

			if (isMultiSelect) {
				if (newSelectedTabs.has(tabId)) {
					newSelectedTabs.delete(tabId);
				} else {
					newSelectedTabs.add(tabId);
				}
			} else {
				newSelectedTabs.clear();
				newSelectedTabs.add(tabId);
			}

			return {
				selectedTabs: newSelectedTabs,
				lastSelectedTab: tabId,
			};
		});
	},

	clearTabSelection: () => {
		set({ selectedTabs: new Set(), lastSelectedTab: null });
	},

	selectTabRange: (fromId: Identifier, toId: Identifier) => {
		set((state) => {
			const newSelectedTabs = new Set<Identifier>();
			const { content } = tabCacheStore.getState();

			// Find all tabs in order across all groups
			const allTabs: Identifier[] = [];
			for (const entry of content.values()) {
				allTabs.push(...entry.leafIDs);
			}

			const fromIndex = allTabs.indexOf(fromId);
			const toIndex = allTabs.indexOf(toId);

			if (fromIndex !== -1 && toIndex !== -1) {
				const start = Math.min(fromIndex, toIndex);
				const end = Math.max(fromIndex, toIndex);

				for (let i = start; i <= end; i++) {
					newSelectedTabs.add(allTabs[i]);
				}
			}

			return {
				selectedTabs: newSelectedTabs,
				lastSelectedTab: toId,
			};
		});
	},

	isTabSelected: (tabId: Identifier) => {
		return get().selectedTabs.has(tabId);
	},

	getSelectedTabs: () => {
		return Array.from(get().selectedTabs);
	},

	hasSelectedTabs: () => {
		return get().selectedTabs.size > 0;
	},
}));
