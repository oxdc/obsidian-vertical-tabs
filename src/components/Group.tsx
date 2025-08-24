import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment, useEffect, useState } from "react";
import { IconButton } from "./IconButton";
import { DEFAULT_GROUP_TITLE, useViewState } from "src/models/ViewState";
import { useApp, useSettings } from "src/models/PluginContext";
import { GroupType } from "src/models/VTWorkspace";
import { moveTabToEnd } from "src/services/MoveTab";
import { Menu, WorkspaceParent } from "obsidian";
import { EVENTS } from "src/constants/Events";
import {
	createBookmarkForGroup,
	loadNameFromBookmark,
} from "src/models/VTBookmark";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { LinkedFolder } from "src/services/OpenFolder";
import { LinkedGroupButton } from "./LinkedGroupButton";
import {
	GroupViewType,
	identifyGroupViewType,
	setGroupViewType,
} from "src/models/VTGroupView";
import { addMissionControlToggle } from "src/services/MissionControlToggle";
import {
	getEmbedLinkFromLeaf,
	getWikiLinkFromLeaf,
} from "src/services/WikiLinks";
import { insertToEditor } from "src/services/InsertText";
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";

interface GroupProps {
	type: GroupType;
	group: WorkspaceParent | null;
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

export const Group = (props: GroupProps) => {
	const app = useApp();
	const workspace = app.workspace;

	const { type, children, group } = props;

	/* Actions (for mutating the shared store) */
	const { hasOnlyOneGroup } = tabCacheStore.getActions();
	const {
		toggleCollapsedGroup,
		setGroupTitle,
		toggleHiddenGroup,
		bindGroupViewToggleEvent,
		getLinkedFolder,
		removeLinkedGroup,
	} = useViewState();

	/* Relevant settings */
	const hideSidebars = useSettings((state) => state.hideSidebars);

	/* Store states (managed by zustand, shared by components) */
	const groupTitles = useViewState((state) => state.groupTitles);
	const collapsedGroups = useViewState((state) => state.collapsedGroups);
	const isHidden = useViewState(
		(state) => !!group && state.hiddenGroups.includes(group.id)
	);
	const lastActiveLeaf = useViewState((state) => state.latestActiveLeaf);

	/* Internal states (managed by the component) */
	const [isEditing, setIsEditing] = useState(false);
	const [ephemeralTitle, setEphemeralTitle] = useState(titleMap[type]);
	const [linkedFolder, setLinkedFolder] = useState<LinkedFolder | null>(null);
	const [viewType, setViewType] = useState<GroupViewType>(() =>
		identifyGroupViewType(group)
	);

	/* Derived states */
	const isSidebar =
		type === GroupType.LeftSidebar || type === GroupType.RightSidebar;
	const isCollapsed =
		(!!group && collapsedGroups.includes(group.id)) ||
		(isSidebar && collapsedGroups.includes(type));
	const isSingleGroupInRoot = hasOnlyOneGroup() && !isSidebar && !!group;
	const isSingleGroupInView = hideSidebars && isSingleGroupInRoot;
	const isActiveGroup = group?.id === lastActiveLeaf?.parent?.id;
	const hasMore =
		!!linkedFolder && linkedFolder.files.length > linkedFolder.offset;
	const title =
		isSidebar || !group
			? titleMap[type]
			: groupTitles.get(group.id) || DEFAULT_GROUP_TITLE;

	/* Commands */
	/* Commands - Group control */
	const toggleCollapsed = () => {
		if (!group) return;
		const modifiedID = isSidebar ? type : group.id;
		toggleCollapsedGroup(modifiedID, !isCollapsed);
	};
	const setHidden = (hidden: boolean) => {
		if (isSidebar || !group) return;
		toggleHiddenGroup(group.id, hidden);
		workspace.trigger(EVENTS.UPDATE_TOGGLE);
	};
	const toggleHidden = () => {
		setHidden(!isHidden);
	};
	const unhideGroup = () => {
		setHidden(false);
	};
	/* Commands - Title */
	const startEditing = () => {
		if (isSidebar) return;
		setEphemeralTitle(title);
		setIsEditing(true);
	};
	const commitTitle = () => {
		if (!group || !isEditing) return;
		const finalTitle = ephemeralTitle.trim() || DEFAULT_GROUP_TITLE;
		setGroupTitle(group.id, finalTitle);
		setIsEditing(false);
	};
	const cancelEditing = () => {
		setIsEditing(false);
		setEphemeralTitle(title);
	};
	const handleTitleEditToggle = () => {
		if (isEditing) {
			commitTitle();
		} else {
			startEditing();
		}
	};
	const handleTitleInputKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			commitTitle();
		} else if (e.key === "Escape") {
			cancelEditing();
		}
	};
	/* Commands - New tab */
	const createLeafNewTabAndOpen = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!group) return;
		const leaf = workspace.getLeaf("split");
		moveTabToEnd(app, leaf.id, group);
		workspace.setActiveLeaf(leaf, { focus: true });
	};
	/* Commands - Linked group */
	const unlinkGroup = () => {
		if (!group) return;
		removeLinkedGroup(group);
		setLinkedFolder(null);
		app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
	};
	const loadMore = async () => {
		if (linkedFolder) {
			await linkedFolder.openNextFiles(false);
		}
	};

	/* Effects */
	// Sync title from bookmark on mount and when group changes
	useEffect(() => {
		if (!group) return;
		const syncTitleFromBookmark = async () => {
			const titleFromBookmark = await loadNameFromBookmark(app, group);
			if (titleFromBookmark && title === DEFAULT_GROUP_TITLE) {
				setGroupTitle(group.id, titleFromBookmark);
				if (!isEditing) setEphemeralTitle(titleFromBookmark);
			}
		};
		const task = setTimeout(syncTitleFromBookmark, REFRESH_TIMEOUT);
		return () => clearTimeout(task);
	});
	// Manage the visibility of the group
	useEffect(() => {
		// Automatically unhide the group if it's the only one in the root split (#175)
		if (isSingleGroupInRoot) unhideGroup();
		group?.containerEl.toggleClass("is-hidden", isHidden);
		return () => group?.containerEl.removeClass("is-hidden");
	}, [isHidden, isSingleGroupInRoot]);
	// Bind and track the events that used for syncing with Obsidian,
	// when the states are changed outside of the component.
	useEffect(() => {
		bindGroupViewToggleEvent(group, setViewType);
	}, [group]);
	// Sync the linked folder state from the global view state store
	useEffect(() => {
		if (!group) return;
		const linkedFolder = getLinkedFolder(group.id);
		setLinkedFolder(linkedFolder);
	}, [group]);
	// Automatically unlink the group
	useEffect(() => {
		if (group?.isLinkedGroup && !getLinkedFolder(group.id)) {
			unlinkGroup();
		}
	}, [group]);
	// Add mission control toggle button to group tab header
	useEffect(() => {
		if (!isSidebar) addMissionControlToggle(group);
	}, [group, isSidebar]);

	/* Menu */
	const menu = new Menu();
	// Customization
	menu.addItem((item) => {
		item.setSection("editing")
			.setTitle(isHidden ? "Show" : "Hide")
			.onClick(toggleHidden);
	});
	menu.addItem((item) => {
		item.setSection("editing")
			.setTitle("Rename")
			.onClick(handleTitleEditToggle);
	});
	// Group view
	menu.addSeparator();
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
	// Tab control
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Bookmark all")
			.onClick(() => {
				if (group) createBookmarkForGroup(app, group, title);
			});
	});
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Bookmark and close all")
			.onClick(async () => {
				if (group) {
					await createBookmarkForGroup(app, group, title);
					group.detach();
				}
			});
	});
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Close all")
			.onClick(() => group?.detach());
	});
	// Wiki links
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("wiki-link")
			.setTitle("Copy as internal links")
			.onClick(() => {
				if (!group) return;
				const links = group.children.map((child) =>
					getWikiLinkFromLeaf(app, child)
				);
				if (links.length > 0)
					navigator.clipboard.writeText(links.join("\n"));
			});
	});
	menu.addItem((item) => {
		item.setSection("wiki-link")
			.setTitle("Copy as list")
			.onClick(() => {
				if (!group) return;
				const links = group.children.map(
					(child) => "- " + getWikiLinkFromLeaf(app, child)
				);
				if (links.length > 0)
					navigator.clipboard.writeText(links.join("\n"));
			});
	});
	menu.addItem((item) => {
		item.setSection("wiki-link")
			.setTitle("Copy as embeds")
			.onClick(() => {
				if (!group) return;
				const links = group.children.map((child) =>
					getEmbedLinkFromLeaf(app, child)
				);
				if (links.length > 0)
					navigator.clipboard.writeText(links.join("\n"));
			});
	});
	menu.addItem((item) => {
		item.setSection("wiki-link")
			.setTitle("Insert as internal links")
			.onClick(() => {
				if (!group) return;
				const links = group.children.map((child) =>
					getWikiLinkFromLeaf(app, child)
				);
				if (links.length > 0 && lastActiveLeaf)
					insertToEditor(app, links.join("\n"), lastActiveLeaf);
			});
	});
	menu.addItem((item) => {
		item.setSection("wiki-link")
			.setTitle("Insert as list")
			.onClick(() => {
				if (!group) return;
				const links = group.children.map(
					(child) => "- " + getWikiLinkFromLeaf(app, child)
				);
				if (links.length > 0 && lastActiveLeaf)
					insertToEditor(app, links.join("\n"), lastActiveLeaf);
			});
	});
	menu.addItem((item) => {
		item.setSection("wiki-link")
			.setTitle("Insert as embeds")
			.onClick(() => {
				if (!group) return;
				const links = group.children.map((child) =>
					getEmbedLinkFromLeaf(app, child)
				);
				if (links.length > 0 && lastActiveLeaf)
					insertToEditor(app, links.join("\n"), lastActiveLeaf);
			});
	});

	const titleEditor = (
		<input
			autoFocus
			value={ephemeralTitle}
			onChange={(e) => setEphemeralTitle(e.target.value)}
			onClick={(e) => e.stopPropagation()}
			onKeyDown={handleTitleInputKeyDown}
			onFocus={(e) => e.target.select()}
			onBlur={commitTitle}
		/>
	);

	const toolbar = (
		<Fragment>
			{!isSidebar && !isEditing && group && (
				<IconButton
					icon="plus"
					action="new-tab"
					tooltip="New tab"
					onClick={createLeafNewTabAndOpen}
				/>
			)}
			{!isSidebar && !isEditing && (
				<IconButton
					icon="pencil"
					action="edit"
					tooltip="Edit"
					onClick={handleTitleEditToggle}
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
			isLinkedGroup={!!linkedFolder}
			title={isEditing ? titleEditor : title}
			isRenaming={isEditing}
			onClick={toggleCollapsed}
			onContextMenu={(e) => menu.showAtMouseEvent(e.nativeEvent)}
			dataType={type}
			toolbar={toolbar}
			icon="right-triangle"
			isCollapsed={isCollapsed && !isSingleGroupInView} // Single group should not be collapsed
			isSidebar={isSidebar}
			isSingleGroup={isSingleGroupInView}
			isActiveGroup={isActiveGroup}
		>
			{!!linkedFolder && (
				<LinkedGroupButton
					title={`Unlink "${linkedFolder.folder.path}"`}
					icon="unlink"
					onClick={unlinkGroup}
				/>
			)}
			{children && children(isSingleGroupInView, viewType)}
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
