import { create } from "zustand";
import * as VT from "./VTWorkspace";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { ItemView } from "obsidian";
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
		if (!plugin.settings.zenMode) return;
		const workspace = plugin.app.workspace as VT.Workspace;
		const activeView = workspace.getActiveViewOfType(ItemView);
		if (!activeView) return;
		const activeLeaf = activeView.leaf as VT.WorkspaceLeaf;
		const isRootLeaf = activeLeaf.getRoot() === workspace.rootSplit;
		if (isRootLeaf) {
			set({ latestActiveLeaf: activeLeaf });
		} else {
			const latestActiveLeaf = get().latestActiveLeaf;
			if (!latestActiveLeaf) return;
			workspace.setActiveLeaf(latestActiveLeaf, { focus: false });
		}
	},
}));
