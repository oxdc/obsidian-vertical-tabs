import { NavigationTreeItem } from "./NavigationTreeItem";
import { MouseEvent } from "react";

interface LinkedGroupButtonProps {
	title: string;
	icon: string;
	onClick?: (event?: MouseEvent<HTMLDivElement>) => void;
}

export const LinkedGroupButton = (props: LinkedGroupButtonProps) => {
	return (
		<NavigationTreeItem
			title={props.title}
			icon={props.icon}
			onClick={props.onClick}
			id={null}
			isTab={true}
			isLinkedGroupBtn={true}
		/>
	);
};
