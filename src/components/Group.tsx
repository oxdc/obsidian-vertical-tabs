import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";
import { DEFAULT_GROUP_TITLE, useViewState } from "src/models/ViewState";

interface GroupProps {
	type: VT.GroupType;
	group: VT.WorkspaceParent | null;
	children?: React.ReactNode;
}

const titleMap: Record<VT.GroupType, string> = {
	[VT.GroupType.LeftSidebar]: "Left sidebar",
	[VT.GroupType.RightSidebar]: "Right sidebar",
	[VT.GroupType.RootSplit]: DEFAULT_GROUP_TITLE,
};

export const Group = ({ type, children, group }: GroupProps) => {
	const isSidebar =
		type === VT.GroupType.LeftSidebar || type === VT.GroupType.RightSidebar;
	const [isCollapsed, setIsCollapsed] = useState(isSidebar ? true : false);
	const [isHidden, setIsHidden] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const { groupTitles, setGroupTitle } = useViewState();
	const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
	const toggleHidden = () => !isSidebar && setIsHidden(!isHidden);
	useEffect(() => {
		if (!group) return;
		group.containerEl.toggleClass("is-hidden", isHidden);
	}, [isHidden]);
	const title =
		isSidebar || group === null
			? titleMap[type]
			: groupTitles.get(group.id);
	const [ephemeralTitle, setEphemeralTitle] = useState(title);
	const handleTitleChange = () => {
		if (group && isEditing) setGroupTitle(group.id, ephemeralTitle);
		setIsEditing(!isEditing);
	};
	const titleEditor = (
		<input
			value={ephemeralTitle}
			onChange={(e) => setEphemeralTitle(e.target.value)}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => {
				if (e.key === "Enter") handleTitleChange();
			}}
		/>
	);
	const props = {
		icon: "right-triangle",
		isCollapsed,
		isSidebar,
	};
	const toolbar = (
		<Fragment>
			{!isSidebar && (
				<IconButton
					icon={isEditing ? "check" : "pencil"}
					action="toggle-editing"
					tooltip={isEditing ? "Save" : "Edit"}
					onClick={handleTitleChange}
				/>
			)}
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
			title={isEditing ? titleEditor : title}
			{...props}
			onClick={toggleCollapsed}
			dataType={type}
			toolbar={toolbar}
		>
			{children}
		</NavigationTreeItem>
	);
};
