/* eslint-disable @typescript-eslint/no-explicit-any */
import { tabCacheStore } from "src/stores/TabCacheStore";
import { Tab } from "./Tab";
import { Group } from "./Group";
import {
	closestCenter,
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useApp, useSettings } from "src/models/PluginContext";
import { useState } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";
import { SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import {
	moveTab,
	moveTabToEnd,
	moveTabToNewGroup,
	moveMultipleTabs,
	moveMultipleTabsToEnd,
	moveMultipleTabsToNewGroup,
} from "src/services/MoveTab";
import { GroupSlot } from "./GroupSlot";
import { Identifier } from "src/models/VTWorkspace";
import { WorkspaceLeaf } from "obsidian";
import { makeLeafNonEphemeral } from "src/services/EphemeralTabs";
import { TabSlot } from "./TabSlot";
import { useTabSelection } from "src/stores/TabSelectionStore";

export const NavigationContent = () => {
	const { groupIDs, groups, leaves } = tabCacheStore.getState();
	const { moveGroupBefore, moveGroupToEnd } = tabCacheStore.getActions();
	const { getSelectedTabs, isTabSelected, clearTabSelection } =
		useTabSelection();
	const app = useApp();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
	);
	const [isDragging, setIsDragging] = useState(false);
	const [isDraggingGroup, setIsDraggingGroup] = useState(false);

	const handleDragStart = (event: DragStartEvent) => {
		setIsDragging(true);
		const { active } = event;
		const isActiveTab = (active.data.current as any).isTab;
		setIsDraggingGroup(!isActiveTab);
	};

	const handleDragEnd = async (event: DragEndEvent) => {
		setIsDragging(false);
		setIsDraggingGroup(false);
		const { active, over } = event;
		if (!over) return;
		const activeID = active.id as Identifier;
		const overID = over.id as Identifier;
		const isActiveTab = (active.data.current as any).isTab;
		const isOverTab = (over.data.current as any).isTab;

		// prettier-ignore
		if (isActiveTab) {
			const selectedTabs = getSelectedTabs();
			const hasMultipleSelection =
				selectedTabs.length > 1 && isTabSelected(activeID);

			let movedTabs: WorkspaceLeaf[] = [];

			if (hasMultipleSelection) {
				// Handle multiple tab movement
				if (isOverTab) {
					movedTabs = moveMultipleTabs(app, selectedTabs, overID);
				} else {
					const groupID = overID.startsWith("slot") ? overID.slice(5) : overID;
					if (groupID === "new") {
						movedTabs = await moveMultipleTabsToNewGroup(app, selectedTabs);
					} else {
						const parent = groups.get(groupID)?.group;
						if (parent) movedTabs = moveMultipleTabsToEnd(app, selectedTabs, parent);
					}
				}
				clearTabSelection();
			} else {
				// Handle single tab movement
				let movedTab: WorkspaceLeaf | null = null;
				if (isOverTab) {
					movedTab = moveTab(app, activeID, overID);
				} else {
					const groupID = overID.startsWith("slot") ? overID.slice(5) : overID;
					if (groupID === "new") {
						movedTab = await moveTabToNewGroup(app, activeID);
					} else {
						const parent = groups.get(groupID)?.group;
						if (parent) movedTab = moveTabToEnd(app, activeID, parent);
					}
				}
				if (movedTab) movedTabs = [movedTab];
			}

			// Make moved tabs non-ephemeral if setting is enabled
			if (movedTabs.length > 0 && useSettings.getState().ephemeralTabs) {
				for (const tab of movedTabs) {
					makeLeafNonEphemeral(tab);
				}
			}
		} else {
			if (isOverTab) {
				const leaf = app.workspace.getLeafById(overID);
				if (!leaf) return;
				moveGroupBefore(activeID, leaf.parent.id);
			} else {
				if (overID === "slot-new") {
					moveGroupToEnd(activeID);
				} else {
					moveGroupBefore(activeID, overID);
				}
			}
		}
	};

	const rootContainerClasses: CssClasses = {
		"obsidian-vertical-tabs-container": true,
		"is-dragging-group": isDraggingGroup,
	};

	const containerClasses: CssClasses = {
		"is-dragging": isDragging,
	};

	// prettier-ignore
	return (
		<div className={toClassName(rootContainerClasses)}>
			<div className={toClassName(containerClasses)}>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext items={[...groupIDs, "slot-new"]}>
						{groupIDs.map((groupID) => {
							const groupEntry = groups.get(groupID);
							if (!groupEntry) return null;
							const { group, groupType, leafIDs } = groupEntry;
							return (
								<Group key={groupID} type={groupType} group={group}>
									{(isSingleGroup, viewType) => (
										<SortableContext items={[...leafIDs, `slot-${groupID}`]}>
											{leafIDs.map((leafID, index, array) => {
												const isLast = index === array.length - 1;
												const leaf = leaves.get(leafID)?.leaf;
												if (!leaf) return null;
												return (
													<Tab
														key={leafID}
														leaf={leaf}
														index={index + 1}
														isLast={isLast}
														isSingleGroup={isSingleGroup}
														viewType={viewType}
													/>
												)}
											)}
											<TabSlot group={groupEntry.group} groupID={groupID} />
										</SortableContext>
									)}
								</Group>
							);
						})}
						<GroupSlot />
					</SortableContext>
					{createPortal(<DragOverlay />, document.body)}
				</DndContext>
			</div>
		</div>
	);
};
