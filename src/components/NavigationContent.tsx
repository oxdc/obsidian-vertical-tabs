import { TabCache } from "src/models/TabCache";
import { Tab } from "./Tab";
import { Group } from "./Group";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { Draggable, Droppable } from "./Movable";
import { moveTab } from "src/services/MoveTab";
import { useApp } from "src/models/PluginContext";
import * as VT from "src/models/VTWorkspace";

interface NavigationContentProps {
	tabs: TabCache;
}

export const NavigationContent = (props: NavigationContentProps) => {
	const app = useApp();
	const groups = Array.from(props.tabs.entries());
	const onDragEnd = (event: DragEndEvent) => {
		const source = event.active.id as VT.Identifier;
		const target = event.over?.id as VT.Identifier;
		moveTab(app, source, target);
	};

	return (
		<div className="obsidian-vertical-tabs-container node-insert-event">
			<div>
				<DndContext onDragEnd={onDragEnd}>
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
