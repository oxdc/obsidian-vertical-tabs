import { NavigationTreeItem } from "./NavigationTreeItem";
import * as VT from "src/models/VTWorkspace";

interface TabSlotProps {
	groupID: VT.Identifier;
}

export const TabSlot = ({ groupID }: TabSlotProps) => {
	return (
		<NavigationTreeItem
			title=""
			icon=""
			id={`slot-${groupID}`}
			isTab={true}
			isTabSlot={true}
		/>
	);
};
