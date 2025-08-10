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
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";
import {
	getEmbedLinkFromLeaf,
	getWikiLinkFromLeaf,
} from "src/services/WikiLinks";
import { insertToEditor } from "src/services/InsertText";

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

export const Group = ({ type, children, group }: GroupProps) => {
	const app = useApp();
	const workspace = app.workspace;
	const isSidebar =
		type === GroupType.LeftSidebar || type === GroupType.RightSidebar;
	const { hasOnlyOneGroup } = tabCacheStore.getActions();
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
		workspace.trigger(EVENTS.UPDATE_TOGGLE);
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

	const lastActiveLeaf = useViewState((state) => state.latestActiveLeaf);
	const isActiveGroup = group?.id === lastActiveLeaf?.parent?.id;

	const props = {
		icon: "right-triangle",
		isCollapsed: isCollapsed && !isSingleGroup, // Single group should not be collapsed
		isSidebar,
		isSingleGroup,
		isActiveGroup,
	};

	const createLeafNewTabAndOpen = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (!group) return;
		const leaf = workspace.getLeaf("split");
		moveTabToEnd(app, leaf.id, group);
		workspace.setActiveLeaf(leaf, { focus: true });
	};

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

	const { bindGroupViewToggleEvent } = useViewState();
	const [viewType, setViewType] = useState<GroupViewType>(() =>
		identifyGroupViewType(group)
	);

	useEffect(() => {
		bindGroupViewToggleEvent(group, setViewType);
	}, [group]);

	const menu = new Menu();

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
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Bookmark all")
			.onClick(() => {
				if (group) createBookmarkForGroup(app, group, getTitle());
			});
	});
	menu.addItem((item) => {
		item.setSection("control")
			.setTitle("Bookmark and close all")
			.onClick(async () => {
				if (group) {
					await createBookmarkForGroup(app, group, getTitle());
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

	const { getLinkedFolder, removeLinkedGroup } = useViewState();
	const [linkedFolder, setLinkedFolder] = useState<LinkedFolder | null>(null);
	useEffect(() => {
		if (!group) return;
		const linkedFolder = getLinkedFolder(group.id);
		setLinkedFolder(linkedFolder);
	}, [group]);

	const unlinkGroup = () => {
		if (group) {
			removeLinkedGroup(group);
			setLinkedFolder(null);
			app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
		}
	};

	const loadMore = async () => {
		if (linkedFolder) {
			await linkedFolder.openNextFiles(false);
		}
	};

	const hasMore =
		!!linkedFolder && linkedFolder.files.length > linkedFolder.offset;

	useEffect(() => {
		if (
			group &&
			group.isLinkedGroup &&
			getLinkedFolder(group.id) === null
		) {
			unlinkGroup();
		}
	}, [group]);

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
			{...props}
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
