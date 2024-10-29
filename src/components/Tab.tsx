import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment } from "react/jsx-runtime";
import { IconButton } from "./IconButton";
import { useEffect, useState } from "react";
import { usePlugin } from "src/models/PluginContext";
import { Menu, WorkspaceLeaf } from "obsidian";
import {
	closeOthersInGroup,
	closeTabsToBottomInGroup,
	closeTabsToTopInGroup,
} from "src/services/CloseTabs";
import { useTabCache } from "src/models/TabCache";
import { useViewState } from "src/models/ViewState";
import { DeduplicatedTitle } from "src/services/DeduplicateTitle";
import { createBookmarkForLeaf } from "src/models/VTBookmark";

interface TabProps {
	leaf: WorkspaceLeaf;
}

export const Tab = ({ leaf }: TabProps) => {
	const plugin = usePlugin();
	const { bindPinningEvent } = useViewState();
	const [isPinned, setIsPinned] = useState(
		leaf.getViewState().pinned ?? false
	);
	const { sort } = useTabCache();
	const { lockFocusOnLeaf, toggleHiddenGroup } = useViewState();
	const lastActiveLeaf = useViewState((state) => state.latestActiveLeaf);

	useEffect(() => {
		bindPinningEvent(leaf, setIsPinned);
	}, [leaf.id]);

	const togglePinned = () => {
		leaf.togglePinned();
		setIsPinned(leaf.getViewState().pinned ?? false);
		sort();
	};

	const unPin = () => {
		leaf.setPinned(false);
		setIsPinned(false);
		sort();
	};

	const closeTab = () => {
		if (!leaf.getViewState().pinned) leaf.detach();
	};

	const midClickCloseTab = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		if (event.button === 1) closeTab();
	};

	const openTab = () => {
		const workspace = plugin.app.workspace;
		workspace.setActiveLeaf(leaf, { focus: true });
		workspace.onLayoutChange();
		toggleHiddenGroup(leaf.parent.id, false);
		lockFocusOnLeaf(plugin.app, leaf);
	};

	const activeOrCloseTab = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		if (event.altKey) {
			closeTab();
		} else {
			openTab();
		}
	};

	const menu = new Menu();

	menu.addItem((item) => {
		item.setSection("bookmark")
			.setTitle("Bookmark")
			.onClick(() => {
				createBookmarkForLeaf(plugin.app, leaf, leaf.getDisplayText());
			});
	});
	menu.addItem((item) => {
		item.setSection("bookmark")
			.setTitle("Bookmark and close")
			.onClick(() => {
				createBookmarkForLeaf(plugin.app, leaf, leaf.getDisplayText());
				leaf.detach();
			});
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close")
			.setDisabled(isPinned)
			.onClick(() => leaf.detach());
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close Others")
			.onClick(() => closeOthersInGroup(plugin.app, leaf));
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close tabs to the top")
			.onClick(() => closeTabsToTopInGroup(plugin.app, leaf));
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close tabs to the bottom")
			.onClick(() => closeTabsToBottomInGroup(plugin.app, leaf));
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close all")
			.setDisabled(isPinned)
			.onClick(() => leaf.parent.detach());
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("pin")
			.setTitle(isPinned ? "Unpin" : "Pin")
			.onClick(togglePinned);
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Move to new window")
			.onClick(() => {
				plugin.app.workspace.duplicateLeaf(leaf, "window");
				leaf.detach();
			});
	});
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Split right")
			.onClick(() =>
				plugin.app.workspace.duplicateLeaf(leaf, "split", "vertical")
			);
	});
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Split down")
			.onClick(() =>
				plugin.app.workspace.duplicateLeaf(leaf, "split", "horizontal")
			);
	});
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Open in new window")
			.onClick(() => {
				plugin.app.workspace.duplicateLeaf(leaf, "window");
			});
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("more").setTitle("More options");
		const submenu = item.setSubmenu();
		leaf.view.onPaneMenu(submenu, "more-options");
		const excludedSections = ["open", "find", "pane"];
		submenu.items = submenu.items.filter(
			(item) =>
				item.section === undefined ||
				!excludedSections.includes(item.section)
		);
	});

	const toolbar = (
		<Fragment>
			{isPinned && (
				<IconButton
					icon="pin"
					action="unpin"
					tooltip="Unpin"
					onClick={unPin}
				/>
			)}
			{!isPinned && (
				<IconButton
					icon="x"
					action="close"
					tooltip="Close tab"
					disabled={isPinned}
					onClick={closeTab}
				/>
			)}
		</Fragment>
	);

	const props = {
		title: DeduplicatedTitle(plugin.app, leaf),
		icon: leaf.getIcon(),
		isActive: leaf.tabHeaderEl?.classList.contains("is-active"),
	};

	return (
		<NavigationTreeItem
			id={leaf.id}
			isTab={true}
			isPinned={isPinned}
			isHighlighted={lastActiveLeaf?.id === leaf.id}
			{...props}
			toolbar={toolbar}
			onClick={activeOrCloseTab}
			onTouchEnd={openTab}
			onAuxClick={midClickCloseTab}
			onDoubleClick={closeTab}
			onContextMenu={(e) => menu.showAtMouseEvent(e.nativeEvent)}
			dataType={leaf.getViewState().type}
			dataId={leaf.id}
		/>
	);
};
