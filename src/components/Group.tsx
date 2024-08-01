import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { useState } from "react";

interface GroupProps {
	type: VT.GroupType;
	children?: React.ReactNode;
}

export const Group = ({ type, children }: GroupProps) => {
	const isSidebar =
		type === VT.GroupType.LeftSidebar || type === VT.GroupType.RightSidebar;
	const [isCollapsed, setIsCollapsed] = useState(isSidebar ? true : false);
	const toggle = () => setIsCollapsed(!isCollapsed);

	const mapToTitle = (type: VT.GroupType) => {
		switch (type) {
			case VT.GroupType.LeftSidebar:
				return "Left Sidebar";
			case VT.GroupType.RightSidebar:
				return "Right Sidebar";
			default:
				return "Grouped Tabs";
		}
	};

	const props = {
		title: mapToTitle(type),
		icon: "right-triangle",
		isCollapsed,
		isSidebar,
	};

	return (
		<NavigationTreeItem isTab={false} {...props} onClick={toggle}>
			{children}
		</NavigationTreeItem>
	);
};
