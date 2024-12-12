import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { useEffect } from "react";
import { useViewState } from "src/models/ViewState";
import { debounce, ItemView } from "obsidian";
import {
	moveSelfToDefaultLocation,
	selfIsNotInTheSidebar,
} from "src/services/MoveTab";
import { resetZoom, zoomIn, zoomOut } from "src/services/TabZoom";
import { isSelfVisible } from "src/services/Visibility";
import {
	installTabHeaderHandlers,
	makeLeafEphemeralOnEditorChange,
	uninstallTabHeaderHandlers,
} from "src/services/EphemeralTabs";
import { deduplicateExistingTabs } from "src/services/DeduplicateTab";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const app = plugin.app;
	const { refresh, sort } = useTabCache();
	const {
		setLatestActiveLeaf,
		refreshToggleButtons,
		lockFocus,
		lockFocusOnLeaf,
	} = useViewState();
	const { loadSettings, toggleZenMode, updateEphemeralTabs } = useSettings();

	useEffect(() => {
		updateEphemeralTabs(plugin.app);
	}, []);

	const autoRefresh = () => {
		setLatestActiveLeaf(plugin);
		if (selfIsNotInTheSidebar(plugin.app)) {
			moveSelfToDefaultLocation(plugin.app);
		}
		if (useSettings.getState().deduplicateTabs) {
			app.workspace.trigger("vertical-tabs:deduplicate-tabs");
		}
		setTimeout(() => {
			updateEphemeralTabs(plugin.app);
			if (isSelfVisible(plugin.app)) {
				refresh(plugin.app);
				sort();
			}
		}, REFRESH_TIMEOUT);
	};

	const updateToggles = () => {
		setTimeout(() => {
			refreshToggleButtons(plugin.app);
		}, REFRESH_TIMEOUT);
	};

	useEffect(() => {
		const workspace = plugin.app.workspace;
		loadSettings(plugin);
		autoRefresh();
		plugin.registerEvent(workspace.on("layout-change", autoRefresh));
		plugin.registerEvent(workspace.on("active-leaf-change", autoRefresh));
		plugin.registerEvent(workspace.on("resize", debounce(updateToggles)));
		plugin.registerEvent(
			workspace.on("vertical-tabs:update-toggle", updateToggles)
		);
		plugin.registerEvent(
			workspace.on("vertical-tabs:ephemeral-tabs", (enabled) => {
				if (enabled) installTabHeaderHandlers(app);
				else uninstallTabHeaderHandlers(app);
			})
		);
		plugin.registerEvent(
			workspace.on("editor-change", (_, info) => {
				if (useSettings.getState().ephemeralTabs) {
					makeLeafEphemeralOnEditorChange(info);
				}
			})
		);
		plugin.registerEvent(
			workspace.on("vertical-tabs:deduplicate-tabs", () => {
				const activeLeaf = deduplicateExistingTabs(app);
				if (activeLeaf) lockFocusOnLeaf(app, activeLeaf);
			})
		);
		plugin.addCommand({
			id: "toggle-zen-mode",
			name: "Toggle zen mode",
			callback: () => {
				toggleZenMode();
				lockFocus(plugin);
				workspace.trigger("vertical-tabs:update-toggle");
			},
		});
		plugin.addCommand({
			id: "zoom-in-current-tab",
			name: "Zoom in current tab",
			callback: () => {
				const view = workspace.getActiveViewOfType(ItemView);
				if (view) zoomIn(view);
			},
		});
		plugin.addCommand({
			id: "zoom-out-current-tab",
			name: "Zoom out current tab",
			callback: () => {
				const view = workspace.getActiveViewOfType(ItemView);
				if (view) zoomOut(view);
			},
		});
		plugin.addCommand({
			id: "zoom-reset-current-tab",
			name: "Reset zoom in current tab",
			callback: () => {
				const view = workspace.getActiveViewOfType(ItemView);
				if (view) resetZoom(view);
			},
		});
	}, []);

	const disableMiddleClickScrolling = (event: React.MouseEvent) => {
		if (event.button === 1) event.preventDefault();
	};

	return (
		<div
			className="vertical-tabs"
			onMouseDown={disableMiddleClickScrolling}
		>
			<NavigationHeader />
			<NavigationContent />
		</div>
	);
};
