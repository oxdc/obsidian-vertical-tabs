import { TabCache } from "src/models/TabCache";
import { Tab } from "./Tab";
import { Group } from "./Group";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Droppable } from "./Droppable";
import { Draggable } from "./Draggable";
import { moveTab, moveTabToEnd } from "src/services/MoveTab";
import { useApp } from "src/models/PluginContext";
import { useState } from "react";
import * as VT from "src/models/VTWorkspace";

interface NavigationContentProps {
	tabs: TabCache;
}

export const NavigationContent = (props: NavigationContentProps) => {
	const app = useApp();
	const groups = Array.from(props.tabs.entries());
	const [isDragging, setIsDragging] = useState(false);
	const handleDragEnd = (event: DragEndEvent) => {
		setIsDragging(false);
		const source = event.active.id as VT.Identifier;
		const target = event.over?.id as VT.Identifier;
		if (target.startsWith("in:")) {
			const groupID = target.slice(3);
			const group = props.tabs.get(groupID);
			if (group.group) {
				moveTabToEnd(app, source, group.group);
			}
		} else {
			moveTab(app, source, target);
		}
	};
	const handleDragMove = () => {
		setIsDragging(true);
	};

	return (
		<div className="obsidian-vertical-tabs-container node-insert-event">
			<div className={`${isDragging ? "is-tab-dragging" : null}`}>
				<DndContext
					onDragEnd={handleDragEnd}
					onDragMove={handleDragMove}
				>
					{groups.map(([group, entry]) => (
						<Group key={group} type={entry.groupType}>
							{entry.leaves.map((leaf) => (
								<Droppable key={leaf.id} id={leaf.id}>
									<Draggable key={leaf.id} id={leaf.id}>
										<Tab key={leaf.id} leaf={leaf} />
									</Draggable>
								</Droppable>
							))}
							<Droppable key={group} id={`in:${group}`} />
						</Group>
					))}
				</DndContext>
			</div>
		</div>
	);
};
