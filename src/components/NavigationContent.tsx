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
import { moveTab, moveTabToEnd, moveTabToNewGroup } from "src/services/MoveTab";
import { GroupSlot } from "./GroupSlot";
import { Identifier } from "src/models/VTWorkspace";
import { WorkspaceLeaf } from "obsidian";
import { makeLeafNonEphemeral } from "src/services/EphemeralTabs";
import { TabSlot } from "./TabSlot";

export const NavigationContent = () => {
	const { groupIDs, content } = tabCacheStore.getState();
	const { swapGroup, moveGroupToEnd } = tabCacheStore.getActions();
	const app = useApp();
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		})
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

		if (isActiveTab) {
			let movedTab: WorkspaceLeaf | null = null;
			if (isOverTab) {
				movedTab = moveTab(app, activeID, overID);
			} else {
				const groupID = overID.startsWith("slot")
					? overID.slice(5)
					: overID;
				if (groupID === "new") {
					movedTab = await moveTabToNewGroup(app, activeID);
				} else {
					const parent = content.get(groupID).group;
					if (parent) movedTab = moveTabToEnd(app, activeID, parent);
				}
			}
			if (movedTab && useSettings.getState().ephemeralTabs) {
				makeLeafNonEphemeral(movedTab);
			}
		} else {
			if (isOverTab) {
				const leaf = app.workspace.getLeafById(overID);
				if (!leaf) return;
				swapGroup(activeID, leaf.parent.id);
			} else {
				if (overID === "slot-new") {
					moveGroupToEnd(activeID);
				} else {
					swapGroup(activeID, overID);
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

	const getGroupIDs = () => [...groupIDs, "slot-new"];

	const getLeaveIDs = (groupID: Identifier) => {
		const group = content.get(groupID);
		return [...group.leafIDs, `slot-${groupID}`];
	};

	const entryOf = (groupID: Identifier) => {
		return content.get(groupID);
	};

	return (
		<div className={toClassName(rootContainerClasses)}>
			<div className={toClassName(containerClasses)}>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext items={getGroupIDs()}>
						{groupIDs.map((groupID) => (
							<Group
								key={groupID}
								type={entryOf(groupID).groupType}
								group={entryOf(groupID).group}
							>
								{(isSingleGroup, viewType) => (
									<SortableContext
										items={getLeaveIDs(groupID)}
									>
										{entryOf(groupID).leaves.map(
											(leaf, index, array) => {
												const isLast =
													index === array.length - 1;
												return (
													<Tab
														key={leaf.id}
														leaf={leaf}
														index={index + 1}
														isLast={isLast}
														isSingleGroup={
															isSingleGroup
														}
														viewType={viewType}
													/>
												);
											}
										)}
										<TabSlot groupID={groupID} />
									</SortableContext>
								)}
							</Group>
						))}
						<GroupSlot />
					</SortableContext>
					{createPortal(<DragOverlay />, document.body)}
				</DndContext>
			</div>
		</div>
	);
};
