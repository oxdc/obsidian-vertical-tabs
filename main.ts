import { Plugin, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { VerticalTabsView, VIEW_TYPE } from "view";
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
		this.registerEventsAndViews();
		this.addRibbonIcon("dice", "Play", this.activateView);
		this.addRibbonIcon("dice", "DEBUG", () => {
			console.log(this.groupedLeaves);
		});
	}

	async registerEventsAndViews() {
		this.app.workspace.on("layout-change", this.refreshLeaves);
		this.registerView(VIEW_TYPE, (leaf) => new VerticalTabsView(leaf));
	}

	async refreshLeaves() {
		if (this) {
			this.groupedLeaves = new DefaultMap(() => []);
			this.app.workspace.iterateRootLeaves((leaf: WorkspaceLeaf) => {
				const parent = leaf.parent as WorkspaceParentWithId;
				const parentId: GroupID = parent.id || DEFUALT_GROUP_ID;
				this.groupedLeaves.get(parentId).push(leaf);
			});
		}
	}

	async activateView() {
		const leaf: WorkspaceLeaf =
			this.app.workspace.getLeavesOfType(VIEW_TYPE)[0] ??
			this.app.workspace.getLeftLeaf(false);
		leaf.setViewState({ type: VIEW_TYPE, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	onunload() {
		this.app.workspace.off("layout-change", this.refreshLeaves);
	}
}
