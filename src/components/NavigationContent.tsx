/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTabCache } from "src/models/TabCache";
import { Tab } from "./Tab";
import { Group } from "./Group";
import { useApp, usePlugin, useSettings } from "src/models/PluginContext";
import { CssClasses, toClassName } from "src/utils/CssClasses";
import { moveTab, moveTabToEnd, moveTabToNewGroup } from "src/services/MoveTab";
import { TabSlot } from "./TabSlot";
import { GroupSlot } from "./GroupSlot";
import { Identifier } from "src/models/VTWorkspace";
import { WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { makeLeafNonEphemeral } from "src/services/EphemeralTabs";
import {
	DNDManager,
	useDNDActions,
	useDNDManager,
} from "src/stores/DNDManager";
import { useEffect } from "react";

export const NavigationContent = () => {
	const { groupIDs, content, swapGroup, moveGroupToEnd } = useTabCache();
	const plugin = usePlugin();
	const app = useApp();

	const handleDragEnd = async (event: DragEvent) => {
		const { isSelectedGroup, isSelectedLeaf } = DNDManager.getActions();
		const { selectedItems, overItem } = DNDManager.getState();
		const isOverGroup =
			overItem instanceof WorkspaceParent || typeof overItem === "string";
		const isOverLeaf = overItem instanceof WorkspaceLeaf;
		const activeID = selectedItems.first()?.id;
		const overID = typeof overItem === "string" ? overItem : overItem?.id;

		if (!activeID || !overID) return;

		if (isSelectedLeaf()) {
			let movedTab: WorkspaceLeaf | null = null;
			if (isOverLeaf) {
				movedTab = moveTab(app, activeID, overID);
			}
			if (isOverGroup) {
				const groupID = overID.startsWith("slot")
					? overID.slice(5)
					: overID;
				if (groupID === "new") {
					movedTab = await moveTabToNewGroup(app, activeID);
				} else {
					const content = useTabCache.getState().content;
					const parent = content.get(groupID).group;
					if (parent) movedTab = moveTabToEnd(app, activeID, parent);
				}
			}
			if (movedTab && useSettings.getState().ephemeralTabs) {
				makeLeafNonEphemeral(movedTab);
			}
		}
		if (isSelectedGroup()) {
			if (isOverLeaf) {
				const leaf = app.workspace.getLeafById(overID);
				if (!leaf) return;
				swapGroup(activeID, leaf.parent.id);
			}
			if (isOverGroup) {
				if (overID === "slot-new") {
					moveGroupToEnd(activeID);
				} else {
					swapGroup(activeID, overID);
				}
			}
		}

		const { setOverItem, setIsDragging } = DNDManager.getActions();
		setOverItem(null);
		setIsDragging(false);
	};

	useEffect(() => {
		const { isEventRegistered } = DNDManager.getState();
		if (isEventRegistered) return;
		plugin.registerDomEvent(document.body, "dragend", handleDragEnd);
		const { registerEvent } = DNDManager.getActions();
		registerEvent();
	}, []);

	const { isSelectedGroup } = useDNDActions();
	const isDragging = useDNDManager((state) => state.isDragging);

	const rootContainerClasses: CssClasses = {
		"obsidian-vertical-tabs-container": true,
		"is-dragging-group": isSelectedGroup(),
	};

	const containerClasses: CssClasses = {
		"is-dragging": isDragging,
	};

	const entryOf = (groupID: Identifier) => {
		return content.get(groupID);
	};

	return (
		<div className={toClassName(rootContainerClasses)}>
			<div className={toClassName(containerClasses)}>
				{groupIDs.map((groupID) => (
					<Group
						key={groupID}
						type={entryOf(groupID).groupType}
						group={entryOf(groupID).group}
					>
						{(isSingleGroup, viewType) => (
							<>
								{entryOf(groupID).leaves.map(
									(leaf, index, array) => {
										const isLast =
											index === array.length - 1;
										return (
											<Tab
												key={leaf.id}
												leaf={leaf}
												index={index + 1}
												isLast={isLast}
												isSingleGroup={isSingleGroup}
												viewType={viewType}
											/>
										);
									}
								)}
								<TabSlot groupID={groupID} />
							</>
						)}
					</Group>
				))}
				<GroupSlot />
			</div>
		</div>
	);
};
