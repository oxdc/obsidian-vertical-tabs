import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment } from "react/jsx-runtime";
import { IconButton } from "./IconButton";
import { useState } from "react";
import { useApp } from "src/models/AppContext";

interface TabProps {
	leaf: VT.WorkspaceLeaf;
}

export const Tab = ({ leaf }: TabProps) => {
	const app = useApp();
	const [isPinned, setIsPinned] = useState(leaf.getViewState().pinned);

	const togglePinned = () => {
		leaf.togglePinned();
		setIsPinned(leaf.getViewState().pinned);
	};

	const activeTab = () => {
		app.workspace.revealLeaf(leaf);
		(app.workspace as VT.Workspace).onLayoutChange();
	};

	const toolbar = (
		<Fragment>
			<IconButton
				icon="pin"
				action="pin"
				tooltip="Pin tab"
				onClick={togglePinned}
			/>
			<IconButton
				icon="x"
				action="close"
				tooltip="Close tab"
				disabled={isPinned}
				onClick={() => leaf.detach()}
			/>
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
		/>
	);
};
