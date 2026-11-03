import { useApp } from "src/models/PluginContext";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { runWithCanSplit } from "src/services/PlatformCanSplit";
import { useViewState } from "src/models/ViewState";

export const GroupSlot = () => {
	const app = useApp();
	const workspace = app.workspace;
	const { lockFocusOnLeaf } = useViewState();

	const createLeafNewGroupAndOpen = () => {
		const source = workspace.getMostRecentLeaf();
		if (!source) return;
		const { clientHeight, clientWidth } = source.parent.containerEl;
		const direction =
			clientHeight > clientWidth ? "horizontal" : "vertical";
		const leaf = runWithCanSplit(() =>
			workspace.createLeafBySplit(source, direction),
		);
		workspace.setActiveLeaf(leaf, { focus: true });
		lockFocusOnLeaf(app, leaf);
	};

	return (
		<NavigationTreeItem
			title="New group"
			icon="plus"
			id={`slot-new`}
			isTab={false}
			isGroupSlot={true}
			onClick={createLeafNewGroupAndOpen}
		/>
	);
};
