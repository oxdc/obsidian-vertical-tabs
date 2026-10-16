import ObsidianVerticalTabs from "src/main";
import { ItemView } from "obsidian";
import { createBookmarkForGroup } from "src/models/VTBookmark";
import { getGroupTitle } from "src/services/Customization";

export function registerBookmarkCommands(plugin: ObsidianVerticalTabs) {
	const app = plugin.app;
	const workspace = plugin.app.workspace;
	const getActiveGroup = () =>
		workspace.getActiveViewOfType(ItemView)?.leaf?.parent;
	return [
		plugin.addCommand({
			id: "bookmark-current-group",
			name: "Bookmark current group",
			callback: async () => {
				const group = getActiveGroup();
				if (!group) return;
				const title = getGroupTitle(group.id);
				await createBookmarkForGroup(app, group, title);
			},
		}),
		plugin.addCommand({
			id: "bookmark-and-close-current-group",
			name: "Bookmark and close current group",
			callback: async () => {
				const group = getActiveGroup();
				if (!group) return;
				const title = getGroupTitle(group.id);
				await createBookmarkForGroup(app, group, title);
				group.detach();
			},
		}),
	];
}
