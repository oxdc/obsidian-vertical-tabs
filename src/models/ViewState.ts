import { create } from "zustand";
import * as VT from "./VTWorkspace";
import { DefaultRecord } from "src/utils/DefaultRecord";

export const DEFAULT_GROUP_TITLE = "Grouped tabs";
const factory = () => DEFAULT_GROUP_TITLE;

export type GroupTitles = DefaultRecord<VT.Identifier, string>;
export const createNewGroupTitles = () =>
	new DefaultRecord(factory) as GroupTitles;

interface ViewState {
	groupTitles: GroupTitles;
	clear: () => void;
	setGroupTitle: (id: VT.Identifier, name: string) => void;
}

export const useViewState = create<ViewState>((set) => ({
	groupTitles: createNewGroupTitles(),
	clear: () => set({ groupTitles: createNewGroupTitles() }),
	setGroupTitle: (id: VT.Identifier, name: string) =>
		set((state) => {
			state.groupTitles.set(id, name);
			return state;
		}),
}));
