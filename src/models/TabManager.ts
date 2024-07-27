import { App, WorkspaceLeaf } from "obsidian";
import { DefaultRecord } from "../utils/DefaultRecord";
import {
	VTWorkspace,
	VTWorkspaceGroup,
	VTWorkspaceID,
	VTWorkspaceLeaf,
	VTWorkspaceParent,
} from "./VTWorkspace";

const DEFUALT_GROUP_ID = "default";

export interface TabManagerOptions {
	includeSiderbars: boolean;
}

const DEFAULT_OPTIONS: TabManagerOptions = {
	includeSiderbars: false,
};

export class TabManager {
	app: App;
	workspace: VTWorkspace;
	options: TabManagerOptions;
	cachedTabs: DefaultRecord<VTWorkspaceID, VTWorkspaceLeaf[]>;

	constructor(app: App, options: TabManagerOptions = DEFAULT_OPTIONS) {
		this.app = app;
		this.workspace = app.workspace as VTWorkspace;
		this.options = options;
	}

	refreshTabs() {
		const iterator = this.options.includeSiderbars
			? this.workspace.iterateAllLeaves
			: this.workspace.iterateRootLeaves;
		iterator((leaf: WorkspaceLeaf) => {
			const parent = leaf.parent as VTWorkspaceParent;
			const parentID: VTWorkspaceID = parent.id || DEFUALT_GROUP_ID;
			this.cachedTabs.get(parentID).push(leaf as VTWorkspaceLeaf);
		});
	}

	moveTabToIndex(leaf: VTWorkspaceLeaf, to: number) {
		const parent = leaf.parentSplit as VTWorkspaceParent;
		const children = parent.children;
		const from = children.indexOf(leaf);
		children.splice(from, 1);
		children.splice(to, 0, leaf);
		parent.selectTab(leaf);
		this.workspace.onLayoutChange();
	}

	sortTabs(
		parent: VTWorkspaceParent,
		focusOn: VTWorkspaceLeaf,
		compareFn: (a: VTWorkspaceLeaf, b: VTWorkspaceLeaf) => number
	) {
		parent.children.sort(compareFn);
		parent.selectTab(focusOn);
		this.workspace.onLayoutChange();
	}

	moveTabToGroup(leaf: VTWorkspaceLeaf, group: VTWorkspaceGroup) {}
}
