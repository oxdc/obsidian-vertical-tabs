import { App } from "obsidian";
import { SessionGroup, SessionStore } from "src/models/Sessions";
import * as VT from "src/models/VTWorkspace";

const DEFAULT_LEFT_SIDEBAR = {
	id: "left-sidebar",
	type: VT.GroupType.LeftSidebar,
	icon: "sidebar-left",
	name: "Left sidebar",
	color: null,
	children: [],
	ref: null,
};

const DEFAULT_RIGHT_SIDEBAR = {
	id: "right-sidebar",
	type: VT.GroupType.RightSidebar,
	icon: "sidebar-right",
	name: "Right sidebar",
	color: null,
	children: [],
	ref: null,
};

const DEFAULT_GROUP = {
	id: "root-split",
	type: VT.GroupType.RootSplit,
	icon: "folder",
	name: "Grouped tabs",
	color: null,
	children: [],
	ref: null,
};

export function newGroup(type: VT.GroupType): SessionGroup {
	switch (type) {
		case VT.GroupType.LeftSidebar:
			return DEFAULT_LEFT_SIDEBAR;
		case VT.GroupType.RightSidebar:
			return DEFAULT_RIGHT_SIDEBAR;
		default:
			return DEFAULT_GROUP;
	}
}

export function refreshSession(app: App, current: SessionStore): SessionStore {
	const workspace = app.workspace as VT.Workspace;
	const { leftSplit, rightSplit, rootSplit } = workspace;

	const groups = new Map();
	const tabs = new Map();

	const leftSidebar =
		current.groups.get("left-sidebar") ||
		newGroup(VT.GroupType.LeftSidebar);
	workspace.iterateLeaves(leftSplit, (leaf) => {
		leftSidebar.children.push(leaf.id);
	});
	groups.set(leftSidebar.id, leftSidebar);

	const rightSidebar =
		newSession.groups.get("right-sidebar") ||
		newGroup(VT.GroupType.RightSidebar);
	workspace.iterateLeaves(rightSplit, (leaf) => {
		rightSidebar.children.push(leaf.id);
	});
	newSession.groups.set(rightSidebar.id, rightSidebar);

	workspace.iterateLeaves(rootSplit, (leaf: VT.WorkspaceLeaf) => {
		const { parent } = leaf;
		const group =
			newSession.groups.get(parent.id) ||
			newGroup(VT.GroupType.RootSplit);
		group.children.push(leaf.id);
		newSession.groups.set(group.id, group);
	});

	return newSession;
}
