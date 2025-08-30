import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { Fragment, useEffect, useRef } from "react";
import {
	useViewState,
	ALT_KEY_EFFECT_DURATION,
	VIEW_CUE_DELAY,
} from "src/models/ViewState";
import { debounce, ItemView, Platform, TFolder } from "obsidian";
import { EVENTS } from "src/constants/Events";
import { REFRESH_TIMEOUT, REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";
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
import { addMenuItemsToFolderContextMenu } from "src/services/OpenFolder";
import { GroupViewType } from "src/models/VTGroupView";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const app = plugin.app;
	const ref = useRef<HTMLDivElement>(null);
	const { refresh, sort } = tabCacheStore.getActions();
	const {
		setLatestActiveLeaf,
		refreshToggleButtons,
		lockFocus,
		forgetNonephemeralTabs,
		uncollapseActiveGroup,
		setCtrlKeyState,
		setAltKeyState,
		increaseViewCueOffset,
		decreaseViewCueOffset,
		modifyViewCueCallback,
		resetViewCueCallback,
		scorllToViewCueFirstTab,
		setIsEditingTabs,
		setGroupViewTypeForCurrentGroup,
		exitMissionControlForCurrentGroup,
	} = useViewState();
	const { loadSettings, toggleZenMode, updateEphemeralTabs } = useSettings();

	// Drag detection state using refs to persist across re-renders
	const dragInProgress = useRef(false);
	const draggedLeaf = useRef<Element | null>(null);

	// Alt key timeout reference to allow cancellation
	const altKeyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Helper function to detect if drag target is a tab
	const isLeafDragTarget = (target: Element): boolean => {
		return (
			target.closest(".workspace-tab-header") !== null ||
			target.closest(".workspace-tab") !== null ||
			target.closest(".vt-tab-handle") !== null ||
			target.classList.contains("workspace-tab-header") ||
			target.classList.contains("workspace-tab") ||
			target.classList.contains("vt-tab-handle")
		);
	};

	const handleDragStart = (e: DragEvent) => {
		const target = e.target as Element;
		if (target && isLeafDragTarget(target)) {
			dragInProgress.current = true;
			draggedLeaf.current = target;
		}
	};

	const handleDragEnd = (e: DragEvent) => {
		if (dragInProgress.current) {
			// Small delay to allow DOM updates to complete
			setTimeout(() => {
				dragInProgress.current = false;
				draggedLeaf.current = null;
			}, 0);
		}
	};

	const handleDrop = () => {
		// if (dragInProgress.current) {
		setTimeout(autoRefresh, REFRESH_TIMEOUT_LONG);
		// }
	};

	const autoRefresh = () => {
		setLatestActiveLeaf(plugin);
		ensureSelfIsOpen(app);
		if (selfIsNotInTheSidebar(app)) {
			moveSelfToDefaultLocation(app);
		}
		if (useSettings.getState().deduplicateTabs) {
			app.workspace.trigger(EVENTS.DEDUPLICATE_TABS);
		}
		setTimeout(() => {
			updateEphemeralTabs(app);
			if (isSelfVisible(app) || Platform.isMobile) {
				refresh(app);
				sort();
			}
		});
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
		plugin.registerEvent(workspace.on(EVENTS.UPDATE_TOGGLE, updateToggles));
		plugin.registerEvent(
			workspace.on(EVENTS.EPHEMERAL_TABS_INIT, (autoClose) => {
				initEphemeralTabs(app);
				installTabHeaderHandlers(app);
				if (autoClose) autoCloseOldEphemeralTabs(app);
			})
		);
		plugin.registerEvent(
			workspace.on(EVENTS.EPHEMERAL_TABS_DEINIT, () => {
				forgetNonephemeralTabs();
				uninstallTabHeaderHandlers(app);
			})
		);
		plugin.registerEvent(
			workspace.on(EVENTS.EPHEMERAL_TABS_UPDATE, (enabled, autoClose) => {
				if (enabled) {
					installTabHeaderHandlers(app);
					if (autoClose) autoCloseOldEphemeralTabs(app);
					makeTabNonEphemeralAutomatically(app);
				} else {
					uninstallTabHeaderHandlers(app);
				}
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
			workspace.on(EVENTS.DEDUPLICATE_TABS, () => {
				deduplicateExistingTabs(app);
				uncollapseActiveGroup(app);
			})
		);
		plugin.registerEvent(
			workspace.on("file-menu", (menu, fileOrFolder) => {
				if (useSettings.getState().backgroundMode) return;
				if (fileOrFolder instanceof TFolder) {
					const folder = fileOrFolder;
					addMenuItemsToFolderContextMenu(app, menu, folder);
				}
			})
		);
		plugin.registerEvent(
			workspace.on(EVENTS.ENHANCED_KEYBOARD_TAB_SWITCH, () => {
				modifyViewCueCallback(app);
			})
		);
		plugin.registerEvent(
			workspace.on(EVENTS.RESET_KEYBOARD_TAB_SWITCH, () => {
				resetViewCueCallback(app);
			})
		);
		plugin.registerDomEvent(window, "keydown", (event) => {
			if (event.key === "Escape") {
				exitMissionControlForCurrentGroup();
			}
			if (event.altKey) {
				setAltKeyState(true);
				// Clear any existing timeout to prevent old resets
				if (altKeyTimeoutRef.current) {
					clearTimeout(altKeyTimeoutRef.current);
				}
				// Set new timeout and store reference
				altKeyTimeoutRef.current = setTimeout(
					() => setAltKeyState(false),
					ALT_KEY_EFFECT_DURATION
				);
			}
			const { enhancedKeyboardTabSwitch } = useSettings.getState();
			if (!enhancedKeyboardTabSwitch) return;
			if (
				(event.ctrlKey || event.metaKey) &&
				(event.key === "Control" ||
					event.key === "Meta" ||
					event.key === "ArrowRight" ||
					event.key === "ArrowLeft")
			) {
				setCtrlKeyState(true);
				if (event.key === "ArrowRight") {
					increaseViewCueOffset();
				} else if (event.key === "ArrowLeft") {
					decreaseViewCueOffset();
				}
				setTimeout(() => {
					if (useViewState.getState().hasCtrlKeyPressed) {
						ref.current?.toggleClass("tab-index-view-cue", true);
						document.body.toggleClass(
							"vt-tab-index-view-cue",
							true
						);
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
		plugin.registerDomEvent(window, "keyup", (event) => {
			if (event.key === "Control" || event.key === "Meta") {
				setCtrlKeyState(false);
				ref.current?.toggleClass("tab-index-view-cue", false);
				document.body.toggleClass("vt-tab-index-view-cue", false);
			}
		});
		plugin.registerDomEvent(document, "dblclick", (event) => {
			makeDblclickedFileNonEphemeral(app, event);
		});
		plugin.registerDomEvent(window, "dragstart", handleDragStart);
		plugin.registerDomEvent(window, "dragend", handleDragEnd);
		plugin.registerDomEvent(window, "drop", handleDrop);
		plugin.addCommand({
			id: "toggle-zen-mode",
			name: "Toggle zen mode",
			callback: () => {
				toggleZenMode();
				lockFocus(plugin);
				workspace.trigger(EVENTS.UPDATE_TOGGLE);
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
		plugin.addCommand({
			id: "set-current-group-default-view",
			name: "Set current group as default view",
			callback: () => {
				setGroupViewTypeForCurrentGroup(GroupViewType.Default);
			},
		});
		plugin.addCommand({
			id: "set-current-group-continuous-view",
			name: "Set current group as continuous view",
			callback: () => {
				setGroupViewTypeForCurrentGroup(GroupViewType.ContinuousView);
			},
		});
		plugin.addCommand({
			id: "set-current-group-column-view",
			name: "Set current group as column view",
			callback: () => {
				setGroupViewTypeForCurrentGroup(GroupViewType.ColumnView);
			},
		});
		plugin.addCommand({
			id: "set-current-group-mission-control-view",
			name: "Set current group as mission control view",
			callback: () => {
				setGroupViewTypeForCurrentGroup(
					GroupViewType.MissionControlView
				);
			},
		});
		plugin.registerHoverLinkSource("vertical-tabs", {
			defaultMod: true,
			display: "Vertical Tabs",
		});

		// Cleanup function to clear alt key timeout on unmount
		return () => {
			if (altKeyTimeoutRef.current) {
				clearTimeout(altKeyTimeoutRef.current);
			}
		};
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
		<Fragment>
			<NavigationHeader container={ref.current} />
			<div
				className="vertical-tabs"
				onMouseDown={disableMiddleClickScrolling}
				ref={ref}
				{...listeners}
			>
				<NavigationContent />
			</div>
		</Fragment>
	);
};
