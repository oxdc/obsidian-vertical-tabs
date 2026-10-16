import {
	App,
	ItemView,
	Platform,
	setIcon,
	setTooltip,
	WorkspaceLeaf,
	WorkspaceParent,
} from "obsidian";
import ObsidianVerticalTabs from "src/main";
import { toggleMissionControlView } from "./MissionControlToggle";
import { iterateRootOrFloatingLeaves } from "./GetTabs";

interface ActionButtonProps {
	icon: string;
	title: string;
	cls?: string;
	onClick: (event: MouseEvent) => void;
}

// prettier-ignore
function createActionButton({ icon, title, cls, onClick }: ActionButtonProps): HTMLElement {
	const button = createEl("button", { cls: `clickable-icon view-action ${cls}` });
	setIcon(button, icon);
	setTooltip(button, title);
	button.addEventListener("mousedown", (event) => event.preventDefault());
	button.addEventListener("click", (event) => { if (event.button === 0 || event.button === 1) onClick(event); });
	return button;
}

function triggerNativeTabList(group: WorkspaceParent, event: MouseEvent) {
	const container = group.tabHeaderContainerEl;
	const icon = container?.querySelector(
		".workspace-tab-header-tab-list:not(.vt-extra-group-button) .clickable-icon",
	);
	if (icon)
		icon.dispatchEvent(
			new MouseEvent("click", {
				bubbles: true,
				cancelable: true,
				button: event.button,
				clientX: event.clientX,
				clientY: event.clientY,
			}),
		);
}

export function removeExtraHeaderButtons(leaf: WorkspaceLeaf) {
	if (!(leaf.view instanceof ItemView)) return;
	leaf.view.headerEl?.querySelector(".vt-header-buttons")?.remove();
}

export function addExtraHeaderButtons(
	leaf: WorkspaceLeaf,
	app: App,
	plugin: ObsidianVerticalTabs,
) {
	removeExtraHeaderButtons(leaf);
	const { rootSplit, rightSplit } = app.workspace;
	if (!plugin.settings.autoHideHorizontalTabs) return;
	if (leaf.getRoot() !== rootSplit) return;
	if (!(leaf.view instanceof ItemView)) return;
	const { headerEl, actionsEl } = leaf.view;
	if (!headerEl || !actionsEl) return;
	const group = leaf.parent;
	if (!group) return;
	const container = headerEl.createDiv({ cls: "vt-header-buttons" });
	actionsEl.after(container);
	if (plugin.settings.showMissionControlToggle) {
		container.appendChild(
			createActionButton({
				icon: "layout-grid",
				title: "Mission control",
				onClick: () => toggleMissionControlView(group),
			}),
		);
	}
	container.appendChild(
		createActionButton({
			icon: "chevron-down",
			title: "Tab list",
			onClick: (event) => triggerNativeTabList(group, event),
		}),
	);
	if (!Platform.isPhone) {
		container.appendChild(
			createActionButton({
				icon: "sidebar-toggle-button-icon",
				title: "Toggle right sidebar",
				cls: "vt-extra-sidebar-toggle",
				onClick: () => rightSplit.toggle(),
			}),
		);
	}
}

export function removeAllExtraHeaderButtons(app: App) {
	iterateRootOrFloatingLeaves(app, removeExtraHeaderButtons);
}

export function refreshExtraHeaderButtons(
	app: App,
	plugin: ObsidianVerticalTabs,
) {
	iterateRootOrFloatingLeaves(app, (leaf) => {
		if (
			plugin.settings.autoHideHorizontalTabs &&
			leaf.getRoot() === app.workspace.rootSplit
		) {
			addExtraHeaderButtons(leaf, app, plugin);
		} else {
			removeExtraHeaderButtons(leaf);
		}
	});
}
