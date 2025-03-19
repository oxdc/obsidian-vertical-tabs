/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtendedGroup, tabCacheStore } from "src/stores/TabCacheStore";
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
import {
	useApp,
	usePersistenceManager,
	useSettings,
} from "src/models/PluginContext";
import { useState } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";
import { SortableContext } from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { moveTab, moveTabToEnd, moveTabToNewGroup } from "src/services/MoveTab";
import { TabSlot } from "./TabSlot";
import { GroupSlot } from "./GroupSlot";
import { Identifier } from "src/models/VTWorkspace";
import { WorkspaceLeaf } from "obsidian";
import { makeLeafNonEphemeral } from "src/services/EphemeralTabs";

export const NavigationContent = () => {
	const persistenceManager = usePersistenceManager();
	const groupOrder = tabCacheStore((state) => state.groupOrder);
	const tabs = tabCacheStore((state) => state.tabs);
	const groups = tabCacheStore((state) => state.groups);
	const { moveGroup, moveGroupToEnd } = tabCacheStore.getActions();
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
					const parent = groups.get(groupID)?.instance;
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
				moveGroup(activeID, leaf.parent.id, persistenceManager);
			} else {
				if (overID === "slot-new") {
					moveGroupToEnd(activeID, persistenceManager);
				} else {
					moveGroup(activeID, overID, persistenceManager);
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

	const getGroupIDs = () => [...groupOrder, "slot-new"];

	const getLeaveIDs = (group: ExtendedGroup) => {
		return [...group.tabs, `slot-${group.instance.id}`];
	};

	const buildGroup = (groupID: string) => {
		const group = groups.get(groupID);
		if (!group) return null;
		return (
			<Group key={groupID} type={group.groupType} group={group.instance}>
				{(isSingleGroup, viewType) => (
					<SortableContext items={getLeaveIDs(group)}>
						{group.tabs.map((leafID, index, array) => {
							const isLast = index === array.length - 1;
							const leaf = tabs.get(leafID)?.instance;
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
							);
						})}
						<TabSlot groupID={groupID} />
					</SortableContext>
				)}
			</Group>
		);
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
						{Array.from(groupOrder).map(buildGroup)}
						<GroupSlot />
					</SortableContext>
					{createPortal(<DragOverlay />, document.body)}
				</DndContext>
			</div>
		</div>
	);
};
