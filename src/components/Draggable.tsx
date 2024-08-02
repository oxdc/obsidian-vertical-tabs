import { useDraggable } from "@dnd-kit/core";
import * as VT from "../models/VTWorkspace";

export interface DraggableProps {
	id: VT.Identifier;
	children?: React.ReactNode;
}

export const Draggable = (props: DraggableProps) => {
	const { attributes, listeners, setNodeRef } = useDraggable({
		id: props.id,
	});
	return (
		<div ref={setNodeRef} {...listeners} {...attributes}>
			{props.children}
		</div>
	);
};
