import { useDroppable } from "@dnd-kit/core";
import { TabSlot } from "./TabSlot";
import * as VT from "../models/VTWorkspace";
import { CssClasses, toClassName } from "src/utils/CssClasses";

export interface DroppableProps {
	id: VT.Identifier;
	children?: React.ReactNode;
}

export const Droppable = (props: DroppableProps) => {
	const { setNodeRef, isOver, active } = useDroppable({
		id: props.id,
	});
	const droppableElClasses: CssClasses = {
		"tab-droppable": true,
		"is-dragging-self": active?.id == props.id,
	};
	return (
		<div ref={setNodeRef} className={toClassName(droppableElClasses)}>
			{isOver && <TabSlot isHidden={active?.id == props.id} />}
			{props.children}
		</div>
	);
};
