import { Identifier } from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { useApp } from "src/models/PluginContext";
import { useTabCache } from "src/models/TabCache";
import { moveTabToEnd } from "src/services/MoveTab";

interface TabSlotProps {
	groupID: Identifier;
}

export const TabSlot = ({ groupID }: TabSlotProps) => {
	const app = useApp();
	const workspace = app.workspace;
	const { content } = useTabCache();
	const group = content.get(groupID).group;

	const createLeafNewTabAndOpen = () => {
		if (!group) return;
		const leaf = workspace.getLeaf("split");
		moveTabToEnd(app, leaf.id, group);
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
