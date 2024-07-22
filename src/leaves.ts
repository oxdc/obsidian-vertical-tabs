import { App, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import DefaultMap from "./utils/defaultmap";

const DEFUALT_GROUP_ID = "default";

export type GroupID = string;
export type GroupedLeaves = DefaultMap<GroupID, WorkspaceLeaf[]>;

export interface WorkspaceParentWithId extends WorkspaceParent {
	id?: GroupID;
}

export function getGroupedLeaves(app: App): GroupedLeaves {
	const groupedLeaves: GroupedLeaves = new DefaultMap(() => []);
	app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
		const parent = leaf.parent as WorkspaceParentWithId;
		const parentId: GroupID = parent.id || DEFUALT_GROUP_ID;
		groupedLeaves.get(parentId).push(leaf);
	});
	return groupedLeaves;
}
