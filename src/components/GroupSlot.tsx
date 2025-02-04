import { useApp } from "src/models/PluginContext";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { moveTabToNewGroup } from "src/services/MoveTab";
import { useViewState } from "src/models/ViewState";

export const GroupSlot = () => {
	const app = useApp();
	const workspace = app.workspace;
	const { lockFocusOnLeaf } = useViewState();

	const createLeafNewGroupAndOpen = async () => {
		const leaf = workspace.getLeaf("tab");
		const movedLeaf = await moveTabToNewGroup(app, leaf.id);
		if (!movedLeaf) return;
		workspace.setActiveLeaf(movedLeaf, { focus: true });
		workspace.onLayoutChange();
		lockFocusOnLeaf(app, movedLeaf);
	};

	const id = "slot-new";

	return (
		<NavigationTreeItem
			id={id}
			item={id}
			title="New group"
			icon="plus"
			isTab={false}
			isGroupSlot={true}
			onClick={createLeafNewGroupAndOpen}
		/>
	);
};
