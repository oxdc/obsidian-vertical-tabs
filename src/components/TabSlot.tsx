import { Identifier } from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { useApp } from "src/models/PluginContext";
import { tabCacheStore } from "src/stores/NewTabCacheStore";
import { moveTabToEnd } from "src/services/MoveTab";

interface TabSlotProps {
	groupID: Identifier;
}

export const TabSlot = ({ groupID }: TabSlotProps) => {
	const app = useApp();
	const workspace = app.workspace;
	const groups = tabCacheStore((state) => state.groups);
	const group = groups.get(groupID);

	const createLeafNewTabAndOpen = () => {
		if (!group) return;
		const leaf = workspace.getLeaf("split");
		moveTabToEnd(app, leaf.id, group.instance);
		workspace.setActiveLeaf(leaf, { focus: true });
		workspace.onLayoutChange();
	};

	return (
		<NavigationTreeItem
			title="New tab"
			icon="plus"
			id={`slot-${groupID}`}
			isTab={true}
			isTabSlot={true}
			onClick={createLeafNewTabAndOpen}
		/>
	);
};
