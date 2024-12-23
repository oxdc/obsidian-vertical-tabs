import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";
import { DEFAULT_GROUP_TITLE, useViewState } from "src/models/ViewState";
import { useApp, useSettings } from "src/models/PluginContext";
import { GroupType, GroupViewType } from "src/models/VTWorkspace";
import { Menu, WorkspaceParent } from "obsidian";
import {
	createBookmarkForGroup,
	loadNameFromBookmark,
} from "src/models/VTBookmark";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";

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
	const { toggleCollapsedGroup } = useViewState();
	const isCollapsed = useViewState((state) => {
		if (group === null) return false;
		const { collapsedGroups } = state;
		const collapsed = collapsedGroups.includes(group.id);
		return collapsed || (isSidebar && collapsedGroups.includes(type));
	});
	const { groupTitles, setGroupTitle, toggleHiddenGroup } = useViewState();
	const isHidden = useViewState((state) =>
		group ? state.hiddenGroups.includes(group.id) : false
	);
	const [isEditing, setIsEditing] = useState(false);
	const toggleCollapsed = () => {
		if (group) {
			const modifiedID = isSidebar ? type : group.id;
			toggleCollapsedGroup(modifiedID, !isCollapsed);
		}
	};
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
	const getTitle = () => {
		let title = ephemeralTitle.trim();
		if (title === "") title = DEFAULT_GROUP_TITLE;
		return title;
	};
	const handleTitleChange = () => {
		if (group && isEditing) {
			setGroupTitle(group.id, getTitle());
		}
		setIsEditing(!isEditing);
	};
	useEffect(() => {
		setTimeout(async () => {
			if (!group) return;
			const titleFromBookmark = await loadNameFromBookmark(app, group);
			if (titleFromBookmark && getTitle() === DEFAULT_GROUP_TITLE) {
				setEphemeralTitle(titleFromBookmark);
				setGroupTitle(group.id, titleFromBookmark);
			}
		}, REFRESH_TIMEOUT);
	});
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
		isCollapsed: isCollapsed && !isSingleGroup, // Single group should not be collapsed
		isSidebar,
		isSingleGroup,
	};
	const toolbar = (
		<Fragment>
			{!isSidebar && !isEditing && (
				<IconButton
					icon="pencil"
					action="edit"
					tooltip="Edit"
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

	const [viewType, setViewType] = useState(GroupViewType.Default);

	const toggleViewClass = (name: string, enable: boolean) => {
		if (!group) return;
		const viewClass = `vt-${name}`;
		group.containerEl.toggleClass(viewClass, enable);
	};

	const enableView = (viewType: GroupViewType) => {
		if (!group) return;
		Object.values(GroupViewType).forEach((key) =>
			toggleViewClass(key, false)
		);
		toggleViewClass(viewType, true);
		setViewType(viewType);
	};

	const menu = new Menu();

	menu.addItem((item) => {
		item.setTitle(isHidden ? "Show" : "Hide").onClick(toggleHidden);
	});
	menu.addItem((item) => {
		item.setTitle("Rename").onClick(handleTitleChange);
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setTitle("Default view")
			.setDisabled(viewType === GroupViewType.Default)
			.onClick(() => enableView(GroupViewType.Default));
	});
	menu.addItem((item) => {
		item.setTitle("Continuous view")
			.setDisabled(viewType === GroupViewType.ContinuousView)
			.onClick(() => enableView(GroupViewType.ContinuousView));
	});
	menu.addItem((item) => {
		item.setTitle("Mission control view")
			.setDisabled(viewType === GroupViewType.MissionControlView)
			.onClick(() => enableView(GroupViewType.MissionControlView));
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setTitle("Bookmark all").onClick(() => {
			if (group) createBookmarkForGroup(app, group, getTitle());
		});
	});
	menu.addItem((item) => {
		item.setTitle("Bookmark and close all").onClick(async () => {
			if (group) {
				await createBookmarkForGroup(app, group, getTitle());
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
