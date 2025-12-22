import ObsidianVerticalTabs from "src/main";
import { ItemView } from "obsidian";
import { resetZoom, zoomIn, zoomOut } from "src/services/TabZoom";

export function registerTabZoomCommands(plugin: ObsidianVerticalTabs) {
	const workspace = plugin.app.workspace;
	return [
		plugin.addCommand({
			id: "zoom-in-current-tab",
			name: "Zoom in current tab",
			callback: () => {
				const view = workspace.getActiveViewOfType(ItemView);
				if (view) zoomIn(view);
			},
		}),
		plugin.addCommand({
			id: "zoom-out-current-tab",
			name: "Zoom out current tab",
			callback: () => {
				const view = workspace.getActiveViewOfType(ItemView);
				if (view) zoomOut(view);
			},
		}),
		plugin.addCommand({
			id: "zoom-reset-current-tab",
			name: "Reset zoom in current tab",
			callback: () => {
				const view = workspace.getActiveViewOfType(ItemView);
				if (view) resetZoom(view);
			},
		}),
	];
}
