import { App, WorkspaceParent } from "obsidian";

export type Identifier = string;

export enum GroupType {
	LeftSidebar = "left-sidebar",
	RightSidebar = "right-sidebar",
	RootSplit = "root-split",
}

export enum GroupViewType {
	Default = "default",
	ContinuousView = "continuous-view",
	MissionControlView = "mission-control-view",
}

export function getGroupType(app: App, group: WorkspaceParent): GroupType {
	const root = group.getRoot();
	const { leftSplit, rightSplit } = app.workspace;
	if (root === leftSplit) return GroupType.LeftSidebar;
	if (root === rightSplit) return GroupType.RightSidebar;
	return GroupType.RootSplit;
}
