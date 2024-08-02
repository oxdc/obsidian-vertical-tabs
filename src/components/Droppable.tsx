import { useDroppable } from "@dnd-kit/core";
import { TabSlot } from "./TabSlot";
import * as VT from "../models/VTWorkspace";

export interface DroppableProps {
	id: VT.Identifier;
	children?: React.ReactNode;
}

export const Droppable = (props: DroppableProps) => {
	const { setNodeRef, isOver, active } = useDroppable({
		id: props.id,
	});
	return (
		<div ref={setNodeRef} className="tab-droppable">
			{isOver && <TabSlot isHidden={active?.id == props.id} />}
			{props.children}
		</div>
	);
};
