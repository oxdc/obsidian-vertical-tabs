import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import {
	REFRESH_TIMEOUT,
	REFRESH_TIMEOUT_LONG,
	useTabCache,
} from "src/models/TabCache";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { useEffect, useRef } from "react";
import { useViewState, VIEW_CUE_DELAY } from "src/models/ViewState";
import { debounce, ItemView, Platform } from "obsidian";
import {
	ensureSelfIsOpen,
	moveSelfToDefaultLocation,
	moveSelfToNewGroupAndHide,
	selfIsNotInTheSidebar,
} from "src/services/MoveTab";
import { resetZoom, zoomIn, zoomOut } from "src/services/TabZoom";
import { isSelfVisible } from "src/services/Visibility";
import {
	autoCloseOldEphemeralTabs,
	initEphemeralTabs,
	installTabHeaderHandlers,
	makeDblclickedFileNonEphemeral,
	makeLeafEphemeralOnEditorChange,
	makeLeafNonEphemeral,
	makeTabNonEphemeralAutomatically,
	uninstallTabHeaderHandlers,
} from "src/services/EphemeralTabs";
import { deduplicateExistingTabs } from "src/services/DeduplicateTab";
import { iterateRootOrFloatingLeaves } from "src/services/GetTabs";
import { SwipeDirection, useTouchSensor } from "src/services/TouchSeneor";
import { getDrawer } from "src/services/MobileDrawer";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const app = plugin.app;
	const ref = useRef<HTMLDivElement>(null);
	const { refresh, sort } = useTabCache();
	const {
		setLatestActiveLeaf,
		refreshToggleButtons,
		lockFocus,
		forgetNonephemeralTabs,
		uncollapseActiveGroup,
		setCtrlKeyState,
		increaseViewCueOffset,
		decreaseViewCueOffset,
		modifyViewCueCallback,
		resetViewCueCallback,
		scorllToViewCueFirstTab,
		setIsEditingTabs,
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
			if (isSelfVisible(app) || Platform.isMobile) {
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
		loadSettings(plugin).then((settings) => {
			if (settings.ephemeralTabs) initEphemeralTabs(app);
			if (settings.enhancedKeyboardTabSwitch) modifyViewCueCallback(app);
			if (settings.backgroundMode) moveSelfToNewGroupAndHide(app);
		});
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
				deduplicateExistingTabs(app);
				uncollapseActiveGroup(app);
			})
		);
		plugin.registerEvent(
			workspace.on("vertical-tabs:enhanced-keyboard-tab-switch", () => {
				modifyViewCueCallback(app);
			})
		);
		plugin.registerEvent(
			workspace.on("vertical-tabs:reset-keyboard-tab-switch", () => {
				resetViewCueCallback(app);
			})
		);
		plugin.registerDomEvent(window, "keydown", (event) => {
			const { enhancedKeyboardTabSwitch } = useSettings.getState();
			if (!enhancedKeyboardTabSwitch) return;
			if (event.ctrlKey || event.metaKey) {
				setCtrlKeyState(true);
				if (event.key === "ArrowRight") {
					increaseViewCueOffset();
				} else if (event.key === "ArrowLeft") {
					decreaseViewCueOffset();
				} else if (
					event.key.length === 1 &&
					!isNaN(parseInt(event.key))
				) {
					event.preventDefault();
				}
				setTimeout(() => {
					if (useViewState.getState().hasCtrlKeyPressed) {
						ref.current?.toggleClass("tab-index-view-cue", true);
						scorllToViewCueFirstTab(app);
					}
				}, VIEW_CUE_DELAY);
				setTimeout(() => {
					if (ref.current?.hasClass("tab-index-view-cue")) {
						scorllToViewCueFirstTab(app);
					}
				}, REFRESH_TIMEOUT_LONG);
			}
		});
		plugin.registerDomEvent(window, "keyup", () => {
			setCtrlKeyState(false);
			ref.current?.toggleClass("tab-index-view-cue", false);
		});
		plugin.registerDomEvent(document, "dblclick", (event) => {
			makeDblclickedFileNonEphemeral(app, event);
		});
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
		plugin.addCommand({
			id: "deduplicate-existing-tabs",
			name: "Deduplicate all existing tabs",
			callback: () => {
				deduplicateExistingTabs(app, true);
				uncollapseActiveGroup(app);
			},
		});
		plugin.registerHoverLinkSource("vertical-tabs", {
			defaultMod: true,
			display: "Vertical Tabs",
		});
	}, []);

	const disableMiddleClickScrolling = (event: React.MouseEvent) => {
		if (event.button === 1) event.preventDefault();
	};

	const disableEditingMode = () => {
		setIsEditingTabs(app, false);
		ref.current?.toggleClass("editing-tabs", false);
	};

	const { listeners } = useTouchSensor({
		minDistance: 20,
		callback: debounce((moved, direction) => {
			if (!useViewState.getState().isEditingTabs) return;
			if (Platform.isMobile && moved) {
				const drawer = getDrawer(app);
				const { leftSplit, rightSplit } = app.workspace;
				if (
					leftSplit === drawer.contained &&
					direction === SwipeDirection.Left
				) {
					disableEditingMode();
					setTimeout(() => leftSplit.collapse(), REFRESH_TIMEOUT);
				} else if (
					rightSplit === drawer.contained &&
					direction === SwipeDirection.Right
				) {
					disableEditingMode();
					setTimeout(() => rightSplit.collapse(), REFRESH_TIMEOUT);
				}
			}
		}),
	});

	return (
		<div
			className="vertical-tabs"
			onMouseDown={disableMiddleClickScrolling}
			ref={ref}
			{...listeners}
		>
			<NavigationHeader container={ref.current} />
			<NavigationContent />
		</div>
	);
};
