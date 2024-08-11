/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTabCache } from "src/models/TabCache";
import { Tab } from "./Tab";
import { Group } from "./Group";
import {
	DndContext,
	DragEndEvent,
	DragOverlay,
	DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useApp } from "src/models/PluginContext";
import { useState } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";
import { SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import * as VT from "src/models/VTWorkspace";
import { moveTab, moveTabToEnd } from "src/services/MoveTab";

export const NavigationContent = () => {
	const { groupIDs, content, swapGroup } = useTabCache();
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
				const parent = content.get(overID).group;
				if (parent) moveTabToEnd(app, activeID, parent);
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

	return (
		<div className={toClassName(rootContainerClasses)}>
			<div className={toClassName(containerClasses)}>
				<DndContext
					sensors={sensors}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				>
					<SortableContext items={groupIDs}>
						{groupIDs.map((groupID) => (
							<Group
								key={groupID}
								type={content.get(groupID).groupType}
								group={content.get(groupID).group}
							>
								<SortableContext
									items={content.get(groupID).leafIDs}
								>
									{content.get(groupID).leaves.map((leaf) => (
										<Tab key={leaf.id} leaf={leaf} />
									))}
								</SortableContext>
							</Group>
						))}
					</SortableContext>
					{createPortal(
						<DragOverlay>
							{/* <div>placeholder</div> */}
						</DragOverlay>,
						document.body
					)}
				</DndContext>
			</div>
		</div>
	);
};
