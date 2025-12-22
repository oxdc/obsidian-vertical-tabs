import { useSettings } from "src/models/PluginContext";
import ObsidianVerticalTabs from "src/main";
import { Platform, TFile, TFolder } from "obsidian";
import { addMenuItemsToFolderContextMenu } from "src/services/OpenFolder";
import { addMenuItemsToFileContextMenu } from "src/services/OpenFile";

export function registerFileMenuEvents(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;

	plugin.registerEvent(
		workspace.on("file-menu", (menu, fileOrFolder) => {
			if (useSettings.getState().backgroundMode) return;
			if (fileOrFolder instanceof TFolder) {
				const folder = fileOrFolder;
				addMenuItemsToFolderContextMenu(plugin.app, menu, folder);
			}
			if (fileOrFolder instanceof TFile && Platform.isDesktop) {
				const file = fileOrFolder;
				addMenuItemsToFileContextMenu(plugin.app, menu, file);
			}
		})
	);
}
