import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { useEffect, useRef } from "react";
import { useViewState } from "src/models/ViewState";
import { debounce, ItemView } from "obsidian";
import {
	ensureSelfIsOpen,
	moveSelfToDefaultLocation,
	selfIsNotInTheSidebar,
} from "src/services/MoveTab";
import { resetZoom, zoomIn, zoomOut } from "src/services/TabZoom";
import { isSelfVisible } from "src/services/Visibility";
import {
	autoCloseOldEphemeralTabs,
	initEphemeralTabs,
	installTabHeaderHandlers,
	makeLeafEphemeralOnEditorChange,
	makeLeafNonEphemeral,
	makeTabNonEphemeralAutomatically,
	uninstallTabHeaderHandlers,
} from "src/services/EphemeralTabs";
import { deduplicateExistingTabs } from "src/services/DeduplicateTab";
import { iterateRootOrFloatingLeaves } from "src/services/GetTabs";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const app = plugin.app;
	const { refresh, sort } = useTabCache();
	const {
		setLatestActiveLeaf,
		refreshToggleButtons,
		lockFocus,
		lockFocusOnLeaf,
		forgetNonephemeralTabs,
		uncollapseActiveGroup,
	} = useViewState();
	const { loadSettings, toggleZenMode, updateEphemeralTabs } = useSettings();

	const autoRefresh = () => {
		setLatestActiveLeaf(plugin);
		ensureSelfIsOpen(app);
		if (selfIsNotInTheSidebar(app)) {
			moveSelfToDefaultLocation(app);
		}
		if (useSettings.getState().deduplicateTabs) {
			app.workspace.trigger("vertical-tabs:deduplicate-tabs");
		}
		setTimeout(() => {
			updateEphemeralTabs(app);
			if (isSelfVisible(app)) {
				refresh(app);
				sort();
			}
		}, REFRESH_TIMEOUT);
	};

	const updateToggles = () => {
		setTimeout(() => {
			refreshToggleButtons(app);
		}, REFRESH_TIMEOUT);
	};

	const autoUncollapseGroup = () => {
		if (useSettings.getState().autoUncollapseGroup && isSelfVisible(app)) {
			uncollapseActiveGroup(app);
		}
	};

	useEffect(() => {
		const workspace = app.workspace;
		loadSettings(plugin).then(() => initEphemeralTabs(app));
		autoRefresh();
		plugin.registerEvent(workspace.on("layout-change", autoRefresh));
		plugin.registerEvent(workspace.on("active-leaf-change", autoRefresh));
		plugin.registerEvent(
			workspace.on("active-leaf-change", autoUncollapseGroup)
		);
		plugin.registerEvent(workspace.on("resize", debounce(updateToggles)));
		plugin.registerEvent(
			workspace.on("vertical-tabs:update-toggle", updateToggles)
		);
		plugin.registerEvent(
			workspace.on("vertical-tabs:ephemeral-tabs-init", (autoClose) => {
				initEphemeralTabs(app);
				installTabHeaderHandlers(app);
				if (autoClose) autoCloseOldEphemeralTabs(app);
			})
		);
		plugin.registerEvent(
			workspace.on("vertical-tabs:ephemeral-tabs-deinit", () => {
				forgetNonephemeralTabs();
				uninstallTabHeaderHandlers(app);
			})
		);
		plugin.registerEvent(
			workspace.on(
				"vertical-tabs:ephemeral-tabs-update",
				(enabled, autoClose) => {
					if (enabled) {
						installTabHeaderHandlers(app);
						if (autoClose) autoCloseOldEphemeralTabs(app);
						makeTabNonEphemeralAutomatically(app);
					} else {
						uninstallTabHeaderHandlers(app);
					}
				}
			)
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
		plugin.addCommand({
			id: "set-all-tabs-nonephemeral",
			name: "Set all tabs non-ephemeral",
			callback: () => {
				if (!useSettings.getState().ephemeralTabs) return;
				iterateRootOrFloatingLeaves(app, (leaf) =>
					makeLeafNonEphemeral(leaf)
				);
			},
		});
	}, []);

	const disableMiddleClickScrolling = (event: React.MouseEvent) => {
		if (event.button === 1) event.preventDefault();
	};

	const ref = useRef<HTMLDivElement>(null);

	return (
		<div
			className="vertical-tabs"
			onMouseDown={disableMiddleClickScrolling}
			ref={ref}
		>
			<NavigationHeader container={ref.current} />
			<NavigationContent />
		</div>
	);
};
