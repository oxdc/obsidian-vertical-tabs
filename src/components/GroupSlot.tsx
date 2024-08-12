import { NavigationTreeItem } from "./NavigationTreeItem";

export const GroupSlot = () => {
	return (
		<NavigationTreeItem
			title=""
			icon=""
			id={`slot-new`}
			isTab={false}
			isGroupSlot={true}
		/>
	);
};
