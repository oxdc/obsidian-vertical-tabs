import { Identifier } from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { useApp, useSettings } from "src/models/PluginContext";
import { moveTabToEnd } from "src/services/MoveTab";
import { WorkspaceParent } from "obsidian";
import { tabCacheStore } from "src/stores/TabCacheStore";

interface TabSlotProps {
	group: WorkspaceParent | null;
	groupID: Identifier;
}

export const TabSlot = ({ group, groupID }: TabSlotProps) => {
	const app = useApp();
	const workspace = app.workspace;
	const showNewTabButtonAtBottom = useSettings(
		(state) => state.showNewTabButtonAtBottom
	);
	const { hasOnlyOneGroup } = tabCacheStore.getActions();
	const asNewTabButton =
		(showNewTabButtonAtBottom || hasOnlyOneGroup()) && !!group;

	const onClick = () => {
		if (asNewTabButton) {
			const leaf = workspace.getLeaf("split");
			moveTabToEnd(app, leaf.id, group);
			workspace.setActiveLeaf(leaf, { focus: true });
		}
	};

	return (
		<NavigationTreeItem
			classNames={{ "as-new-tab-button": asNewTabButton }}
			title={asNewTabButton ? "New tab" : ""}
			icon={asNewTabButton ? "plus" : "slot"}
			id={`slot-${groupID}`}
			isTab={true}
			isTabSlot={true}
			onClick={onClick}
		/>
	);
};
