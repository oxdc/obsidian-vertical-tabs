import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";
import { useViewState } from "src/models/ViewState";
import { useApp, useSettings } from "src/models/PluginContext";
import { GroupType } from "src/models/VTWorkspace";
import { Menu, WorkspaceParent } from "obsidian";
import { EVENTS } from "src/constants/Events";
import {
	createBookmarkForGroup,
	loadNameFromBookmark,
} from "src/models/VTBookmark";
import {
	DEFAULT_GROUP_TITLE,
	tabCacheStore,
} from "src/stores/NewTabCacheStore";
import { LinkedFolder } from "src/services/OpenFolder";
import { LinkedGroupButton } from "./LinkedGroupButton";
import {
	GroupViewType,
	identifyGroupViewType,
	setGroupViewType,
} from "src/models/VTGroupView";
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";

interface GroupProps {
	type: GroupType;
	group: WorkspaceParent;
	children?: (
		isSingleGroup: boolean,
		viewType: GroupViewType
	) => React.ReactNode;
}

const titleMap: Record<GroupType, string> = {
	[GroupType.LeftSidebar]: "Left sidebar",
	[GroupType.RightSidebar]: "Right sidebar",
	[GroupType.RootSplit]: DEFAULT_GROUP_TITLE,
};

export const Group = ({ type, children, group }: GroupProps) => {
	const app = useApp();
	const workspace = app.workspace;
	const { hasOnlyOneGroup, setGroupState } = tabCacheStore.getActions();
	const hideSidebars = useSettings((state) => state.hideSidebars);
	const lastActiveLeaf = useViewState((state) => state.latestActiveLeaf);
	const { bindGroupViewToggleEvent, getLinkedFolder, removeLinkedGroup } =
		useViewState();

	// Basic state
	const isSidebar =
		type === GroupType.LeftSidebar || type === GroupType.RightSidebar;
	const isSingleGroup = hasOnlyOneGroup() && hideSidebars && !isSidebar;
	const isActiveGroup = group.id === lastActiveLeaf?.parent?.id;

	// Group state
	const groupState = tabCacheStore((state) => ({
		state: state.groups.get(group.id)?.getState(),
		_v: state.stateVersion,
	})).state;
	const isCollapsed = groupState?.collapsed ?? false;
	const isHidden = isSidebar ? false : groupState?.hidden ?? false;

	// Title state
	const title = isSidebar
		? titleMap[type]
		: groupState?.title ?? DEFAULT_GROUP_TITLE;
	const [isEditing, setIsEditing] = useState(false);
	const [ephemeralTitle, setEphemeralTitle] = useState(title);

	// View type state
	const [viewType, setViewType] = useState<GroupViewType>(() =>
		identifyGroupViewType(group)
	);

	// Linked folder state
	const [linkedFolder, setLinkedFolder] = useState<LinkedFolder | null>(null);
	const hasMore =
		!!linkedFolder && linkedFolder.files.length > linkedFolder.offset;

	// Initialize ephemeral title when title changes
	useEffect(() => {
		setEphemeralTitle(title);
	}, [title]);

	// Load title from bookmark if needed
	useEffect(() => {
		setTimeout(async () => {
			const titleFromBookmark = await loadNameFromBookmark(app, group);
			if (titleFromBookmark && getTitle() === DEFAULT_GROUP_TITLE) {
				setGroupState(group.id, { title: titleFromBookmark });
			}
		}, REFRESH_TIMEOUT);
	}, []);

	// Setup view type toggle binding
	useEffect(() => {
		bindGroupViewToggleEvent(group, setViewType);
	}, [group]);

	// Initialize linked folder state
	useEffect(() => {
		setLinkedFolder(getLinkedFolder(group.id));
	}, [group]);

	// Check if group needs unlinking
	useEffect(() => {
		if (group.isLinkedGroup && getLinkedFolder(group.id) === null) {
			unlinkGroup();
		}
	}, [group]);

	// Helper functions
	const getTitle = () => {
		const trimmedTitle = ephemeralTitle.trim();
		return trimmedTitle === "" ? DEFAULT_GROUP_TITLE : trimmedTitle;
	};

	// Event handlers
	const toggleCollapsed = () =>
		setGroupState(group.id, { collapsed: !isCollapsed });

	const toggleHidden = () => {
		if (isSidebar) return;
		setGroupState(group.id, { hidden: !isHidden });
		workspace.trigger(EVENTS.UPDATE_TOGGLE);
	};

	const handleTitleChange = () => {
		if (isEditing && !isSidebar) {
			setGroupState(group.id, { title: getTitle() });
		}
		setIsEditing(!isEditing);
	};

	const unlinkGroup = () => {
		removeLinkedGroup(group);
		setLinkedFolder(null);
		app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
	};

	const loadMore = async () => {
		if (linkedFolder) {
			await linkedFolder.openNextFiles(false);
		}
	};

	// Context menu setup
	const menu = new Menu();

	// Editing section
	menu.addItem((item) => {
		item.setSection("editing")
			.setTitle(isHidden ? "Show" : "Hide")
			.onClick(toggleHidden);
	});
	menu.addItem((item) => {
		item.setSection("editing")
			.setTitle("Rename")
			.onClick(handleTitleChange);
	});
	menu.addSeparator();

	// Group view section
	menu.addItem((item) => {
		item.setSection("group-view")
			.setTitle("Default view")
			.setDisabled(viewType === GroupViewType.Default)
			.onClick(() => setGroupViewType(group, GroupViewType.Default));
	});
	menu.addItem((item) => {
		item.setSection("group-view")
			.setTitle("Continuous view")
			.setDisabled(viewType === GroupViewType.ContinuousView)
			.onClick(() =>
				setGroupViewType(group, GroupViewType.ContinuousView)
			);
	});
	menu.addItem((item) => {
		item.setSection("group-view")
			.setTitle("Column view")
			.setDisabled(viewType === GroupViewType.ColumnView)
			.onClick(() => setGroupViewType(group, GroupViewType.ColumnView));
	});
	menu.addItem((item) => {
		item.setSection("group-view")
			.setTitle("Mission control view")
			.setDisabled(viewType === GroupViewType.MissionControlView)
			.onClick(() =>
				setGroupViewType(group, GroupViewType.MissionControlView)
			);
	});
	menu.addSeparator();

	// Control section
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Bookmark all")
			.onClick(() => createBookmarkForGroup(app, group, getTitle()));
	});
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Bookmark and close all")
			.onClick(async () => {
				await createBookmarkForGroup(app, group, getTitle());
				group.detach();
			});
	});
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Close all")
			.onClick(() => group.detach());
	});

	// Toolbar setup
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

	// Title editor component
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

	return (
		<NavigationTreeItem
			id={group.id}
			isTab={false}
			isLinkedGroup={!!linkedFolder}
			title={isEditing ? titleEditor : title}
			isRenaming={isEditing}
			onClick={toggleCollapsed}
			onContextMenu={(e) => menu.showAtMouseEvent(e.nativeEvent)}
			dataType={type}
			toolbar={toolbar}
			icon="right-triangle"
			isCollapsed={isCollapsed && !isSingleGroup}
			isSidebar={isSidebar}
			isSingleGroup={isSingleGroup}
			isActiveGroup={isActiveGroup}
		>
			{!!linkedFolder && (
				<LinkedGroupButton
					title={`Unlink "${linkedFolder.folder.path}"`}
					icon="unlink"
					onClick={unlinkGroup}
				/>
			)}
			{children && children(isSingleGroup, viewType)}
			{hasMore && (
				<LinkedGroupButton
					title="Load more"
					icon="ellipsis"
					onClick={loadMore}
				/>
			)}
		</NavigationTreeItem>
	);
};
