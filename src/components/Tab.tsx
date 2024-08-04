import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment } from "react/jsx-runtime";
import { IconButton } from "./IconButton";
import { useState } from "react";
import { usePlugin } from "src/models/PluginContext";
import { Menu } from "obsidian";
import {
	closeOthersInGroup,
	closeTabsToBottomInGroup,
	closeTabsToTopInGroup,
} from "src/services/CloseTabs";

interface TabProps {
	leaf: VT.WorkspaceLeaf;
}

export const Tab = ({ leaf }: TabProps) => {
	const plugin = usePlugin();
	const [isPinned, setIsPinned] = useState(leaf.getViewState().pinned);

	const togglePinned = () => {
		leaf.togglePinned();
		setIsPinned(leaf.getViewState().pinned);
	};

	const unPin = () => {
		leaf.setPinned(false);
		setIsPinned(false);
	};

	const activeTab = () => {
		plugin.app.workspace.revealLeaf(leaf);
		(plugin.app.workspace as VT.Workspace).onLayoutChange();
	};

	const menu = new Menu();

	menu.addItem((item) => {
		item.setTitle("Close").onClick(() => leaf.detach());
	});
	menu.addItem((item) => {
		item.setTitle("Close Others").onClick(() =>
			closeOthersInGroup(plugin.app, leaf)
		);
	});
	menu.addItem((item) => {
		item.setTitle("Close tabs to the top").onClick(() =>
			closeTabsToTopInGroup(plugin.app, leaf)
		);
	});
	menu.addItem((item) => {
		item.setTitle("Close tabs to the bottom").onClick(() =>
			closeTabsToBottomInGroup(plugin.app, leaf)
		);
	});
	menu.addItem((item) => {
		item.setTitle("Close all").onClick(() => leaf.parent.detach());
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setTitle(isPinned ? "Unpin" : "Pin").onClick(togglePinned);
	});
	menu.addSeparator();
	menu.addItem((item) => {
		item.setTitle("Move to new window").onClick(() => {
			plugin.app.workspace.duplicateLeaf(leaf, "window");
			leaf.detach();
		});
	});
	menu.addItem((item) => {
		item.setTitle("Split right").onClick(() =>
			plugin.app.workspace.duplicateLeaf(leaf, "split", "vertical")
		);
	});
	menu.addItem((item) => {
		item.setTitle("Split down").onClick(() =>
			plugin.app.workspace.duplicateLeaf(leaf, "split", "horizontal")
		);
	});
	menu.addItem((item) => {
		item.setTitle("Open in new window").onClick(() => {
			plugin.app.workspace.duplicateLeaf(leaf, "window");
		});
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
					onClick={() => leaf.detach()}
				/>
			)}
		</Fragment>
	);

	const props = {
		title: leaf.getDisplayText(),
		icon: leaf.getIcon(),
		isActive: leaf.tabHeaderEl?.classList.contains("is-active"),
	};

	return (
		<NavigationTreeItem
			isTab={true}
			isPinned={isPinned}
			{...props}
			toolbar={toolbar}
			onClick={activeTab}
			onContextMenu={(e) => menu.showAtMouseEvent(e.nativeEvent)}
			dataType={leaf.getViewState().type}
			dataId={leaf.id}
		/>
	);
};
