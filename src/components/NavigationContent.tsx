/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTabCache } from "src/models/TabCache";
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
import * as VT from "src/models/VTWorkspace";
import {
	isSelfTheOnlyChildOfGroup,
	moveTab,
	moveTabToEnd,
	moveTabToNewGroup,
} from "src/services/MoveTab";
import { TabSlot } from "./TabSlot";
import { GroupSlot } from "./GroupSlot";

export const NavigationContent = () => {
	const { groupIDs, content, swapGroup } = useTabCache();
	const excludeSelf = useSettings.use.excludeSelf();
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
	const handleDragEnd = (event: DragEndEvent) => {
		setIsDragging(false);
		setIsDraggingGroup(false);
		const { active, over } = event;
		if (!over) return;
		const activeID = active.id as VT.Identifier;
		const overID = over.id as VT.Identifier;
		const isActiveTab = (active.data.current as any).isTab;
		const isOverTab = (over.data.current as any).isTab;

		if (isActiveTab) {
			if (isOverTab) {
				moveTab(app, activeID, overID);
			} else {
				const groupID = overID.startsWith("slot")
					? overID.slice(5)
					: overID;
				if (groupID === "new") {
					moveTabToNewGroup(app, activeID);
				} else {
					const parent = content.get(groupID).group;
					if (parent) moveTabToEnd(app, activeID, parent);
				}
			}
		} else {
			if (isOverTab) {
				const leaf = app.workspace.getLeafById(overID);
				if (!leaf) return;
				const parent = leaf.parent as VT.WorkspaceParent;
				swapGroup(activeID, parent.id);
			} else {
				swapGroup(activeID, overID);
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

	const getLeaveIDs = (groupID: VT.Identifier) => {
		const group = content.get(groupID);
		return [...group.leafIDs, `slot-${groupID}`];
	};

	const entryOf = (groupID: VT.Identifier) => {
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
						{groupIDs.map((groupID) =>
							isSelfTheOnlyChildOfGroup(app, groupID) &&
							excludeSelf ? null : (
								<Group
									key={groupID}
									type={entryOf(groupID).groupType}
									group={entryOf(groupID).group}
								>
									<SortableContext
										items={getLeaveIDs(groupID)}
									>
										{entryOf(groupID).leaves.map((leaf) => (
											<Tab key={leaf.id} leaf={leaf} />
										))}
										{isDragging && !isDraggingGroup && (
											<TabSlot groupID={groupID} />
										)}
									</SortableContext>
								</Group>
							)
						)}
						<GroupSlot />
					</SortableContext>
					{createPortal(<DragOverlay />, document.body)}
				</DndContext>
			</div>
		</div>
	);
};
