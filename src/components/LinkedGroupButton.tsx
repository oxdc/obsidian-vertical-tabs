import { NavigationTreeItem } from "./NavigationTreeItem";

interface LinkedGroupButtonProps {
	title: string;
	icon: string;
	onClick?: (event?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const LinkedGroupButton = (props: LinkedGroupButtonProps) => {
	return (
		<NavigationTreeItem
			id={null}
			item={null}
			title={props.title}
			icon={props.icon}
			onClick={props.onClick}
			isTab={true}
			isLinkedGroupBtn={true}
		/>
	);
};
