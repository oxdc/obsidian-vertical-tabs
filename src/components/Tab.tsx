import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { TabToolbar } from "./TabToolbar";

interface TabProps {
	leaf: VT.WorkspaceLeaf;
}

export const Tab = ({ leaf }: TabProps) => {
	const props = {
		title: leaf.getDisplayText(),
		icon: leaf.getIcon(),
		isActive: leaf.tabHeaderEl?.classList.contains("is-active"),
		isPinned: leaf.getViewState().pinned,
	};

	return (
		<NavigationTreeItem isTab={true} {...props} toolbar={<TabToolbar />} />
	);
};
