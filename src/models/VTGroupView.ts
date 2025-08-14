import { App, debounce, WorkspaceParent } from "obsidian";
import { useSettings } from "./PluginContext";
import { Identifier } from "./VTWorkspace";
import { EVENTS } from "src/constants/Events";
import { sortLeafDomsInGroup } from "src/services/SortTabDom";
import { REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";

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
	if (viewType === GroupViewType.ContinuousView) {
		el.classList.toggle(
			"vt-continuous-view-show-metadata",
			useSettings.getState().continuousViewShowMetadata
		);
		el.classList.toggle(
			"vt-continuous-view-show-backlinks",
			useSettings.getState().continuousViewShowBacklinks
		);
	} else {
		el.classList.remove(
			"vt-continuous-view-show-metadata",
			"vt-continuous-view-show-backlinks"
		);
	}
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
	group.trigger(EVENTS.GROUP_VIEW_CHANGE, viewType);
	const autoExit = (event: MouseEvent) => {
		const targetEl = event.target as HTMLElement;
		const leafEl = targetEl.matchParent(".workspace-leaf");
		if (!leafEl) return;
		normalizeGroupViewType(group?.containerEl, GroupViewType.Default);
	};
	const scrollToActiveLeaf = () => {
		if (!group) return;
		const activeIndex = group.currentTab;
		if (activeIndex < 0 || activeIndex >= group.children.length) return;
		const activeLeaf = group.children[activeIndex];
		if (!activeLeaf) return;
		activeLeaf.containerEl.scrollIntoView({
			behavior: "smooth",
			block: "center",
			inline: "center",
		});
	};
	switch (viewType) {
		case GroupViewType.ContinuousView:
		case GroupViewType.ColumnView:
			sortLeafDomsInGroup(group);
			break;
		case GroupViewType.MissionControlView:
			group?.containerEl?.addEventListener("dblclick", autoExit, {
				once: true,
			});
			scrollToActiveLeaf();
			break;
	}
}

export function refreshGroupViewTypes(app: App) {
	const processedGroups = new Set<Identifier>();
	app.workspace.iterateAllLeaves((leaf) => {
		const group = leaf.parent;
		if (!group || processedGroups.has(group.id)) return;
		const viewType = identifyGroupViewType(group);
		normalizeGroupViewType(group.containerEl, viewType);
		processedGroups.add(group.id);
	});
}

export function syncUIForGroupView(group: WorkspaceParent | null) {
	if (!group) return;
	const viewType = identifyGroupViewType(group);
	if (
		viewType === GroupViewType.ContinuousView ||
		viewType === GroupViewType.ColumnView
	) {
		sortLeafDomsInGroup(group);
	}
}

export const setColumnViewMinWidth = debounce((value: number) => {
	document.body.style.setProperty("--vt-column-view-min-width", `${value}px`);
}, REFRESH_TIMEOUT_LONG);

export const setMissionControlViewZoomFactor = debounce((value: number) => {
	document.body.style.setProperty(
		"--vt-mission-control-view-leaf-zoom-factor",
		value.toString()
	);
}, REFRESH_TIMEOUT_LONG);
