import { Plugin, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import DefaultMap from "default_map";

type GroupID = string;

interface WorkspaceParentWithId extends WorkspaceParent {
	id?: GroupID;
}

const DEFUALT_GROUP_ID = "default";

export default class ObsidianVerticalTabs extends Plugin {
	groupedLeaves: DefaultMap<GroupID, WorkspaceLeaf[]>;

	async onload() {
		this.refreshLeaves();
		this.registerEvents();

		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Play",
			(evt: MouseEvent) => {
				console.log(this.groupedLeaves);
			}
		);
		ribbonIconEl.addClass("my-plugin-ribbon-class");
	}

	async registerEvents() {
		this.app.workspace.on("layout-change", this.refreshLeaves);
	}

	async refreshLeaves() {
		this.groupedLeaves = new DefaultMap(() => []);
		this.app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
			const parent = leaf.parent as WorkspaceParentWithId;
			const parentId: GroupID = parent.id || DEFUALT_GROUP_ID;
			this.groupedLeaves.get(parentId).push(leaf);
		});
	}

	onunload() {}
}
