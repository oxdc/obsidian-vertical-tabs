import { Identifier } from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";

interface TabSlotProps {
	groupID: Identifier;
}

export const TabSlot = ({ groupID }: TabSlotProps) => {
	return (
		<NavigationTreeItem
			title=""
			icon="slot"
			id={`slot-${groupID}`}
			isTab={true}
			isTabSlot={true}
		/>
	);
};
