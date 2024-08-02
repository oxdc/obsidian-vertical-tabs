import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { useState } from "react";

interface GroupProps {
	type: VT.GroupType;
	children?: React.ReactNode;
}

const titleMap: Record<VT.GroupType, string> = {
	[VT.GroupType.LeftSidebar]: "Left sidebar",
	[VT.GroupType.RightSidebar]: "Right sidebar",
	[VT.GroupType.RootSplit]: "Grouped tabs",
};

export const Group = ({ type, children }: GroupProps) => {
	const isSidebar =
		type === VT.GroupType.LeftSidebar || type === VT.GroupType.RightSidebar;
	const [isCollapsed, setIsCollapsed] = useState(isSidebar ? true : false);
	const toggle = () => setIsCollapsed(!isCollapsed);
	const title = titleMap[type];
	const props = {
		icon: "right-triangle",
		isCollapsed,
		isSidebar,
	};
	return (
		<NavigationTreeItem
			isTab={false}
			title={title}
			{...props}
			onClick={toggle}
			dataType={type}
		>
			{children}
		</NavigationTreeItem>
	);
};
