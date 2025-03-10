import { App, WorkspaceLeaf } from "obsidian";
import { createStoreWithActions } from "src/models/StoreWithActions";
import {
	isHoverEditorEnabled,
	iterateLeavesControlledByHoverEditor,
} from "../services/HoverEditorTabs";
import { REFRESH_TIMEOUT_LONG } from "src/stores/TabCacheStore";
import { Identifier } from "src/models/VTWorkspace";

type ManagedLeafState = {
	managedLeaves: Set<Identifier>;
	updatedAt: number;
	updateInterval: number;
};

type ManagedLeafActions = {
	refresh(app: App): void;
	isManagedLeaf(app: App, leaf: WorkspaceLeaf): boolean;
};

type ManagedLeafStore = ManagedLeafState & {
	actions: ManagedLeafActions;
};

export const managedLeafStore = createStoreWithActions<ManagedLeafStore>(
	(set, get) => ({
		managedLeaves: new Set(),
		updatedAt: 0,
		updateInterval: REFRESH_TIMEOUT_LONG,
		actions: {
			refresh(app: App) {
				const managedLeaves = new Set<Identifier>();
				if (isHoverEditorEnabled(app)) {
					iterateLeavesControlledByHoverEditor(app, (leaf) => {
						managedLeaves.add(leaf.id);
					});
				}
				const updatedAt = new Date().getTime();
				set({ managedLeaves, updatedAt });
			},
			isManagedLeaf(app: App, leaf: WorkspaceLeaf): boolean {
				const { managedLeaves, updatedAt, updateInterval } = get();
				const now = new Date().getTime();
				if (!updatedAt || now - updatedAt > updateInterval) {
					get().actions.refresh(app);
				}
				return managedLeaves.has(leaf.id);
			},
		},
	})
);
