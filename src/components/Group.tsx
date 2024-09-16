import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";
import { DEFAULT_GROUP_TITLE, useViewState } from "src/models/ViewState";
import { useApp } from "src/models/PluginContext";

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
	const app = useApp();
	const workspace = app.workspace as VT.Workspace;
	const isSidebar =
		type === VT.GroupType.LeftSidebar || type === VT.GroupType.RightSidebar;
	const [isCollapsed, setIsCollapsed] = useState(isSidebar ? true : false);
	const { groupTitles, setGroupTitle, toggleHiddenGroup } = useViewState();
	const isHidden = useViewState((state) =>
		group ? state.hiddenGroups.includes(group.id) : false
	);
	const [isEditing, setIsEditing] = useState(false);
	const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
	const toggleHidden = () => {
		if (isSidebar) return;
		if (group) toggleHiddenGroup(app, group.id, !isHidden);
		workspace.trigger("vertical-tabs:update-toggle");
	};
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
			autoFocus
			value={ephemeralTitle}
			onChange={(e) => setEphemeralTitle(e.target.value)}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => {
				if (e.key === "Enter") handleTitleChange();
			}}
			onBlur={handleTitleChange}
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
			id={isSidebar ? null : group?.id ?? null}
			isTab={false}
			title={isEditing ? titleEditor : title}
			isRenaming={isEditing}
			{...props}
			onClick={toggleCollapsed}
			dataType={type}
			toolbar={toolbar}
		>
			{children}
		</NavigationTreeItem>
	);
};
