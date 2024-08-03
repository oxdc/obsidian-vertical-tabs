import { useDraggable } from "@dnd-kit/core";
import * as VT from "../models/VTWorkspace";

export interface DraggableProps {
	id: VT.Identifier;
	children?: React.ReactNode;
}

export const Draggable = (props: DraggableProps) => {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id: props.id,
	});
	const style = {
		transform: transform
			? `translate3d(0, ${transform.y}px, 0)`
			: undefined,
	};
	return (
		<div ref={setNodeRef} style={style} {...listeners} {...attributes}>
			{props.children}
		</div>
	);
};
