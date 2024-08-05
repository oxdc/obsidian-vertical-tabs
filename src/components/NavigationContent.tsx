import { TabCache } from "src/models/TabCache";
import { Tab } from "./Tab";
import { Group } from "./Group";
import {
	DndContext,
	DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { Droppable } from "./Droppable";
import { Draggable } from "./Draggable";
import { moveTab, moveTabToEnd } from "src/services/MoveTab";
import { useApp } from "src/models/PluginContext";
import { useState } from "react";
import * as VT from "src/models/VTWorkspace";
import { CssClasses, toClassName } from "src/utils/CssClasses";

interface NavigationContentProps {
	tabs: TabCache;
}

export const NavigationContent = (props: NavigationContentProps) => {
	const app = useApp();
	const groups = Array.from(props.tabs.entries());
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		})
	);
	const [isDragging, setIsDragging] = useState(false);
	const handleDragEnd = (event: DragEndEvent) => {
		setIsDragging(false);
		const source = event.active.id as VT.Identifier;
		const target = event.over?.id as VT.Identifier;
		if (target && target.startsWith("in:")) {
			const groupID = target.slice(3);
			if (!props.tabs.has(groupID)) return;
			const group = props.tabs.get(groupID);
			if (group.group === null) return;
			moveTabToEnd(app, source, group.group);
		} else {
			moveTab(app, source, target);
		}
	};
	const handleDragMove = () => {
		setIsDragging(true);
	};
	const containerClasses: CssClasses = {
		"is-tab-dragging": isDragging,
	};

	return (
		<div className="obsidian-vertical-tabs-container node-insert-event">
			<div className={toClassName(containerClasses)}>
				<DndContext
					sensors={sensors}
					onDragEnd={handleDragEnd}
					onDragMove={handleDragMove}
				>
					{groups.map(([groupID, entry]) => (
						<Group
							key={groupID}
							type={entry.groupType}
							group={entry.group}
						>
							{entry.leaves.map((leaf) => (
								<Droppable key={leaf.id} id={leaf.id}>
									<Draggable key={leaf.id} id={leaf.id}>
										<Tab key={leaf.id} leaf={leaf} />
									</Draggable>
								</Droppable>
							))}
							<Droppable key={groupID} id={`in:${groupID}`} />
						</Group>
					))}
				</DndContext>
			</div>
		</div>
	);
};
