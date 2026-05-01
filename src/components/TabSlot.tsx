import { Identifier } from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { useApp, useSettings } from "src/models/PluginContext";
import { moveTabToEnd } from "src/services/MoveTab";
import { WorkspaceParent } from "obsidian";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { NewTabButtonPlacement } from "src/models/NewTab";

interface TabSlotProps {
	group: WorkspaceParent | null;
	groupID: Identifier;
}

export const TabSlot = ({ group, groupID }: TabSlotProps) => {
	const app = useApp();
	const workspace = app.workspace;
	const newTabButtonPlacement = useSettings(
		(state) => state.newTabButtonPlacement
	);
	const { hasOnlyOneGroup } = tabCacheStore.getActions();
	const alwaysOpenInNewTab = useSettings((state) => state.alwaysOpenInNewTab);
	const shouldShowNewTabButton =
		newTabButtonPlacement === NewTabButtonPlacement.TabSlot ||
		newTabButtonPlacement === NewTabButtonPlacement.Both;
	const asNewTabButton =
		(shouldShowNewTabButton || hasOnlyOneGroup()) &&
		!!group &&
		!alwaysOpenInNewTab &&
		newTabButtonPlacement !== NewTabButtonPlacement.None;

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
