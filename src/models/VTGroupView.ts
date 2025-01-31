import { WorkspaceParent } from "obsidian";

export enum GroupViewType {
	Default = "vt-default-view",
	ContinuousView = "vt-continuous-view",
	ColumnView = "vt-column-view",
	MissionControlView = "vt-mission-control-view",
}

function normalizeGroupViewType(
	el: HTMLElement | null,
	viewType: GroupViewType
) {
	if (!el) return;
	el.classList.add(viewType);
	Object.values(GroupViewType).forEach((targetType) => {
		if (targetType !== viewType) el.classList.remove(targetType);
	});
}

export function identifyGroupViewType(
	group: WorkspaceParent | null
): GroupViewType {
	if (!group || !group.containerEl) return GroupViewType.Default;
	const classes = group.containerEl.classList;
	for (const viewType of Object.values(GroupViewType)) {
		if (classes.contains(viewType)) {
			normalizeGroupViewType(group.containerEl, viewType);
			return viewType;
		}
	}
	const viewType = GroupViewType.Default;
	normalizeGroupViewType(group.containerEl, viewType);
	return viewType;
}

export function setGroupViewType(
	group: WorkspaceParent | null,
	viewType: GroupViewType
) {
	if (!group || !group.containerEl) return;
	normalizeGroupViewType(group.containerEl, viewType);
	group.trigger("vertical-tabs:group-view-change", viewType);
	if (viewType === GroupViewType.MissionControlView) {
		const autoExit = (event: MouseEvent) => {
			const targetEl = event.target as HTMLElement;
			const leafEl = targetEl.matchParent(".workspace-leaf");
			if (!leafEl) return;
			normalizeGroupViewType(group?.containerEl, GroupViewType.Default);
		};
		group?.containerEl?.addEventListener("dblclick", autoExit, {
			once: true,
		});
	}
}
