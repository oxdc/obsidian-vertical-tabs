import { App, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import DefaultRecord from "./utils/defaultmap";

const DEFUALT_GROUP_ID = "default";

export type GroupID = string;
export type GroupedLeaves = DefaultRecord<GroupID, WorkspaceLeaf[]>;

export interface WorkspaceParentWithId extends WorkspaceParent {
	id?: GroupID;
}

export function getGroupedLeaves(app: App): GroupedLeaves {
	const groupedLeaves: GroupedLeaves = new DefaultRecord(() => []);
	app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
		const parent = leaf.parent as WorkspaceParentWithId;
		const parentId: GroupID = parent.id || DEFUALT_GROUP_ID;
		groupedLeaves.get(parentId).push(leaf);
	});
	return groupedLeaves;
}
