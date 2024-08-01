import { useDraggable, useDroppable } from "@dnd-kit/core";
import * as VT from "../models/VTWorkspace";

export interface MovableProps {
	id: VT.Identifier;
	children?: React.ReactNode;
}

export const Droppable = (props: MovableProps) => {
	const { isOver, setNodeRef } = useDroppable({
		id: props.id,
	});
	const style = {
		minHeight: "20px",
		backgroundColor: isOver ? "green" : undefined,
	};

	return (
		<div ref={setNodeRef} style={style}>
			{props.children}
		</div>
	);
};

export const Draggable = (props: MovableProps) => {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: props.id,
	});
	const style = {
		backgroundColor: isDragging ? "red" : undefined,
		// transform: CSS.Transform.toString(transform),
		// height: transform ? "0px" : undefined,
	};

	return (
		<div ref={setNodeRef} style={style} {...listeners} {...attributes}>
			{props.children}
		</div>
	);
};
