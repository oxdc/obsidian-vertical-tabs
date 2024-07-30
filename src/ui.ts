import { ItemView, setIcon, setTooltip, WorkspaceLeaf } from "obsidian";
import { getGroupedLeaves, GroupedLeaves, GroupID } from "./leaves";
import DefaultRecord from "./utils/defaultmap";

export const VIEW_TYPE = "vertical-tabs";
export const VIEW_TEXT = "Vertical Tabs";

type HiddenGroups = DefaultRecord<GroupID, boolean>;

interface LeafWithTabHeaderEl extends WorkspaceLeaf {
	tabHeaderEl: HTMLElement;
}

export class VerticalTabsView extends ItemView {
	groupedTabs: GroupedLeaves;
	hiddenGroups: HiddenGroups;
	toggleShowAllTabs: HTMLElement;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
		this.icon = "gallery-vertical";
		if (localStorage.getItem("showAllTabs") === undefined) {
			localStorage.setItem("showAllTabs", "false");
		}
		this.hiddenGroups = new DefaultRecord(() => false);
		this.groupedTabs = getGroupedLeaves(this.app);
		this.app.workspace.on("layout-change", () => {
			this.groupedTabs = getGroupedLeaves(this.app);
			this.render();
		});
	}

	getViewType() {
		return VIEW_TYPE;
	}

	getDisplayText() {
		return VIEW_TEXT;
	}

	async onOpen() {
		this.render();
	}

	async render() {
		const container = this.containerEl;
		container.empty();
		const header = container.createDiv({ cls: "nav-header" });
		const content = container
			.createDiv({
				cls: "obsidian-vertical-tabs-container tag-container",
			})
			.createDiv();
		await this.renderHeader(header);
		await this.renderContent(content);
		if (localStorage.getItem("showAllTabs") === "true") {
			this.setShowAllTabs();
		} else {
			this.setShowActiveTabs();
		}
	}

	async renderHeader(container: HTMLElement) {
		const toolbar = container.createDiv({ cls: "nav-buttons-container" });
		this.toggleShowAllTabs = await this.renderHeaderButton(
			toolbar,
			"app-window",
			"Show all tabs"
		);
		this.toggleShowAllTabs.addEventListener("click", () => {
			if (localStorage.getItem("showAllTabs") === "true") {
				this.setShowActiveTabs();
			} else {
				this.setShowAllTabs();
			}
		});
	}

	async setShowAllTabs() {
		this.containerEl.doc.body.addClass("show-all-tabs");
		this.containerEl.doc.body.removeClass("show-active-tabs");
		localStorage.setItem("showAllTabs", "true");
		this.toggleShowAllTabs.addClass("is-active");
	}

	async setShowActiveTabs() {
		this.containerEl.doc.body.addClass("show-active-tabs");
		this.containerEl.doc.body.removeClass("show-all-tabs");
		localStorage.setItem("showAllTabs", "false");
		this.toggleShowAllTabs.removeClass("is-active");
	}

	async renderContent(root: HTMLElement) {
		const groupedTabs = getGroupedLeaves(this.app);
		for (const [groupID, leaves] of groupedTabs.entries()) {
			const children = await this.renderTreeItem(root);
			if (this.hiddenGroups.get(groupID)) {
				continue;
			}
			for (const leaf of leaves) {
				this.renderTreeItem(children, false, leaf);
			}
		}
	}

	async renderTreeItem(
		container: HTMLElement,
		isGroupName = true,
		leaf: WorkspaceLeaf | GroupID = "default"
	) {
		const item = container.createDiv({ cls: "tree-item" });
		const self = item.createDiv({ cls: "tree-item-self" });
		const icon = self.createDiv({ cls: "tree-item-icon" });
		const inner = self.createDiv({ cls: "tree-item-inner" });
		const inlineToolbar = self.createDiv({
			cls: ["tree-item-flair-outer", "tab-toolbar"],
		});
		const children = container.createDiv({ cls: "tree-item-children" });
		if (isGroupName) {
			const groupID = leaf as GroupID;
			item.addClass("is-group");
			setIcon(icon, "folder");
			inner.createDiv({
				cls: "tree-item-inner-text",
				text: "Grouped Tabs",
			});
			const button = await this.renderToolbarButton(
				inlineToolbar,
				"chevron-up",
				"Toggle group"
			);
			button.addEventListener("click", () => {
				const isOriginallyHidden = this.hiddenGroups.get(groupID);
				this.hiddenGroups.set(groupID, !isOriginallyHidden);
				if (isOriginallyHidden) {
					children.removeClass("is-hidden");
					setIcon(button, "chevron-down");
				} else {
					children.addClass("is-hidden");
					setIcon(button, "chevron-up");
				}
			});
		} else {
			const tab = leaf as LeafWithTabHeaderEl;
			item.addClass("is-tab");
			item.addEventListener("click", () => {
				this.app.workspace.revealLeaf(tab);
				this.render();
			});
			self.addClass("is-clickable");
			if (tab.tabHeaderEl.classList.contains("is-active")) {
				self.addClass("is-active");
			}
			if (tab.getViewState().pinned) {
				item.addClass("is-pinned");
			}
			setIcon(icon, tab.getIcon());
			inner.createDiv({
				cls: "tree-item-inner-text",
				text: tab.getDisplayText(),
			});
			this.renderToolbarButton(inlineToolbar, "pin", "Toggle pin", () => {
				tab.togglePinned();
				this.render();
			});
			this.renderToolbarButton(inlineToolbar, "x", "Close tab", () => {
				tab.detach();
			});
		}
		return children;
	}

	async renderToolbarButton(
		container: HTMLElement,
		iconName: string,
		tooltipText: string,
		onClick = () => {}
	) {
		const button = container.createDiv({
			cls: ["clickable-icon", "action-button", `action-${iconName}`],
		});
		setIcon(button, iconName);
		setTooltip(button, tooltipText);
		button.addEventListener("click", onClick);
		return button;
	}

	async renderHeaderButton(
		container: HTMLElement,
		iconName: string,
		tooltipText: string,
		onClick = () => {}
	) {
		const button = container.createDiv({
			cls: ["clickable-icon", "nav-action-button", `action-${iconName}`],
		});
		setIcon(button, iconName);
		setTooltip(button, tooltipText);
		button.addEventListener("click", onClick);
		return button;
	}

	async onClose() {
		this.containerEl.empty();
	}
}
