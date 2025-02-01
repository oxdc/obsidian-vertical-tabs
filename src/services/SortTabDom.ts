import { WorkspaceParent } from "obsidian";

export function sortLeafDomsInGroup(group: WorkspaceParent) {
	const container = group.tabsContainerEl;
	if (!container) return;
	group.children.forEach((leaf) => {
		if (leaf.containerEl) {
			container.appendChild(leaf.containerEl);
		}
	});
}
