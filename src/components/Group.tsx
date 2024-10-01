import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";
import { DEFAULT_GROUP_TITLE, useViewState } from "src/models/ViewState";
import { useApp } from "src/models/PluginContext";
import { GroupType } from "src/models/VTWorkspace";
import { WorkspaceParent } from "obsidian";

interface GroupProps {
	type: GroupType;
	group: WorkspaceParent | null;
	children?: React.ReactNode;
}

const titleMap: Record<GroupType, string> = {
	[GroupType.LeftSidebar]: "Left sidebar",
	[GroupType.RightSidebar]: "Right sidebar",
	[GroupType.RootSplit]: DEFAULT_GROUP_TITLE,
};

export const Group = ({ type, children, group }: GroupProps) => {
	const app = useApp();
	const workspace = app.workspace;
	const isSidebar =
		type === GroupType.LeftSidebar || type === GroupType.RightSidebar;
	const globalCollpaseState = useViewState(
		(state) => state.globalCollapseState
	);
	const [isCollapsed, setIsCollapsed] = useState(
		isSidebar ? true : globalCollpaseState
	);

	useEffect(() => {
		if (isSidebar) return;
		setIsCollapsed(globalCollpaseState);
	}, [globalCollpaseState]);

	const { groupTitles, setGroupTitle, toggleHiddenGroup } = useViewState();
	const isHidden = useViewState((state) =>
		group ? state.hiddenGroups.includes(group.id) : false
	);
	const [isEditing, setIsEditing] = useState(false);
	const toggleCollapsed = () => setIsCollapsed(!isCollapsed);
	const toggleHidden = () => {
		if (isSidebar) return;
		if (group) toggleHiddenGroup(group.id, !isHidden);
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
