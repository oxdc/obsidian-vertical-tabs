import { App, WorkspaceLeaf } from "obsidian";
import { DefaultRecord } from "../utils/DefaultRecord";
import { VTWorkspaceID } from "./VTWorkspaceID";
import { VTWorkspaceLeaf } from "./VTWorkspaceLeaf";
import { VTWorkspaceParent } from "./VTWorkspaceParent";

const DEFUALT_GROUP_ID = "default";

export class TabManager {
	cachedTabs: DefaultRecord<VTWorkspaceID, VTWorkspaceLeaf[]>;
	app: App;

	constructor(app: App) {
		this.app = app;
		this.cachedTabs = new DefaultRecord(() => []);
	}

	refreshTabs(includeSiderbars: boolean) {
		const iterator = includeSiderbars
			? this.app.workspace.iterateAllLeaves
			: this.app.workspace.iterateRootLeaves;
		this.cachedTabs.clear();
		iterator((leaf: WorkspaceLeaf) => {
			const parent = leaf.parent as VTWorkspaceParent;
			const parentID: VTWorkspaceID = parent.id || DEFUALT_GROUP_ID;
			this.cachedTabs.get(parentID).push(leaf as VTWorkspaceLeaf);
		});
	}
}
