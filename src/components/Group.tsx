import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";

interface GroupProps {
	type: VT.GroupType;
	group: VT.WorkspaceParent | null;
	children?: React.ReactNode;
}

const titleMap: Record<VT.GroupType, string> = {
	[VT.GroupType.LeftSidebar]: "Left sidebar",
	[VT.GroupType.RightSidebar]: "Right sidebar",
	[VT.GroupType.RootSplit]: "Grouped tabs",
};

export const Group = ({ type, children, group }: GroupProps) => {
	const isSidebar =
		type === VT.GroupType.LeftSidebar || type === VT.GroupType.RightSidebar;
	const [isCollapsed, setIsCollapsed] = useState(isSidebar ? true : false);
	const [isHidden, setIsHidden] = useState(false);
	const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
	const toggleHidden = () => !isSidebar && setIsHidden(!isHidden);
	useEffect(() => {
		if (!group) return;
		group.containerEl.toggleClass("is-hidden", isHidden);
	}, [isHidden]);
	const title = titleMap[type];
	const props = {
		icon: "right-triangle",
		isCollapsed,
		isSidebar,
	};
	const toolbar = (
		<Fragment>
			{!isSidebar && (
				<IconButton
					icon={isHidden ? "eye" : "eye-off"}
					action="toggle-hidden"
					tooltip={isHidden ? "Show" : "Hide"}
					onClick={toggleHidden}
				/>
			)}
		</Fragment>
	);
	return (
		<NavigationTreeItem
			isTab={false}
			title={title}
			{...props}
			onClick={toggleCollapsed}
			dataType={type}
			toolbar={toolbar}
		>
			{children}
		</NavigationTreeItem>
	);
};
