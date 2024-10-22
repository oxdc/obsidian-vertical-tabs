import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";
import { DEFAULT_GROUP_TITLE, useViewState } from "src/models/ViewState";
import { useApp, useSettings } from "src/models/PluginContext";
import { GroupType } from "src/models/VTWorkspace";
import { Menu, WorkspaceParent } from "obsidian";
import { createBookmarkForGroup } from "src/models/VTBookmark";
import { useTabCache } from "src/models/TabCache";

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
	const { hasOnlyOneGroup } = useTabCache();
	const hideSidebars = useSettings((state) => state.hideSidebars);
	const isSingleGroup =
		hasOnlyOneGroup() && hideSidebars && !isSidebar && !!group;
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
			onFocus={(e) => e.target.select()}
			onBlur={handleTitleChange}
		/>
	);
	const props = {
		icon: "right-triangle",
		isCollapsed,
		isSidebar,
		isSingleGroup,
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

	const menu = new Menu();

	menu.addItem((item) => {
		item.setTitle(isHidden ? "Show" : "Hide").onClick(toggleHidden);
	});
	menu.addItem((item) => {
		item.setTitle("Rename").onClick(handleTitleChange);
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setTitle("Bookmark all").onClick(() => {
			if (group) createBookmarkForGroup(app, group, ephemeralTitle);
		});
	});
	menu.addItem((item) => {
		item.setTitle("Bookmark and close all").onClick(() => {
			if (group) {
				createBookmarkForGroup(app, group, ephemeralTitle);
				group.detach();
			}
		});
	});
	menu.addItem((item) => {
		item.setTitle("Close all").onClick(() => group?.detach());
	});

	return (
		<NavigationTreeItem
			id={isSidebar ? null : group?.id ?? null}
			isTab={false}
			title={isEditing ? titleEditor : title}
			isRenaming={isEditing}
			{...props}
			onClick={toggleCollapsed}
			onContextMenu={(e) => menu.showAtMouseEvent(e.nativeEvent)}
			dataType={type}
			toolbar={toolbar}
		>
			{children}
		</NavigationTreeItem>
	);
};
