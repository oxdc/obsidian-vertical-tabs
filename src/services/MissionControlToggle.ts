import { setIcon, WorkspaceParent } from "obsidian";
import {
	GroupViewType,
	identifyGroupViewType,
	setGroupViewType,
} from "src/models/VTGroupView";

export function addMissionControlToggle(group: WorkspaceParent | null) {
	if (!group) return;

	const spacer = group.tabHeaderContainerEl.querySelector(
		".workspace-tab-header-spacer"
	);
	if (!spacer) return;

	// Check if the toggle button already exists
	const existingToggleBtn = group.tabHeaderContainerEl.querySelector(
		".vt-mission-control-toggle-button"
	);
	if (existingToggleBtn) return;

	// Add the toggle button after the spacer
	const toggleBtn = group.tabHeaderContainerEl.createDiv({
		cls: "workspace-tab-header-tab-list vt-mission-control-toggle-button",
	});
	const icon = toggleBtn.createSpan({ cls: "clickable-icon" });
	setIcon(icon, "layout-grid");
	spacer.after(toggleBtn);

	// Add the handler
	toggleBtn.addEventListener("click", () => {
		const viewType = identifyGroupViewType(group);
		if (viewType === GroupViewType.MissionControlView) {
			setGroupViewType(group, GroupViewType.Default);
		} else {
			setGroupViewType(group, GroupViewType.MissionControlView);
		}
	});
}
