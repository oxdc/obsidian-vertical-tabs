import { NavigationTreeItem } from "./NavigationTreeItem";
import { Fragment } from "react/jsx-runtime";
import { IconButton } from "./IconButton";
import { useEffect, useRef, useState } from "react";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { Menu, Platform, WorkspaceLeaf } from "obsidian";
import { BrowserView } from "obsidian-typings";
import {
	closeOthersInGroup,
	closeTabsToBottomInGroup,
	closeTabsToTopInGroup,
} from "src/services/CloseTabs";
import { tabCacheStore } from "src/stores/TabCacheStore";
import { useViewState, VIEW_CUE_PREV } from "src/models/ViewState";
import { DeduplicatedTitle } from "src/services/DeduplicateTitle";
import {
	createBookmarkForLeaf,
	createBookmarkForLeafHistory,
} from "src/models/VTBookmark";
import {
	isDeferredLeaf,
	loadDeferredLeaf,
} from "src/services/LoadDeferredLeaf";
import { useTouchSensor } from "src/services/TouchSeneor";
import { zoomIn, zoomOut, resetZoom } from "src/services/TabZoom";
import { makeLeafNonEphemeral } from "src/services/EphemeralTabs";
import { HistoryBrowserModal } from "src/views/HistoryBrowserModal";
import { getOpenFileOfLeaf } from "src/services/GetTabs";
import { GroupViewType, setGroupViewType } from "src/models/VTGroupView";
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";
import { VerticalTabsView } from "src/views/VerticalTabsView";

interface TabProps {
	leaf: WorkspaceLeaf;
	index: number;
	isLast: boolean;
	isSingleGroup?: boolean;
	viewType?: GroupViewType;
}

export const Tab = ({
	leaf,
	index,
	isLast,
	isSingleGroup,
	viewType,
}: TabProps) => {
	const plugin = usePlugin();
	const app = plugin.app;
	const workspace = app.workspace;
	const { setGroupState } = tabCacheStore.getActions();
	const enableTabZoom = useSettings((state) => state.enableTabZoom);
	const alwaysOpenInNewTab = useSettings((state) => state.alwaysOpenInNewTab);
	const { refresh, sort } = tabCacheStore.getActions();
	const {
		bindPinningEvent,
		bindEphemeralToggleEvent,
		lockFocusOnLeaf,
		hookLatestActiveTab,
		mapViewCueIndex,
		registerViewCueTab,
	} = useViewState();
	const lastActiveLeaf = useViewState((state) => state.latestActiveLeaf);
	const isEditingTabs = useViewState((state) => state.isEditingTabs);

	// Component refs
	const ref = useRef<HTMLDivElement>(null);

	// Basic state
	const isSelf = leaf.view instanceof VerticalTabsView;
	const isWebViewer = leaf.view.getViewType() === "webviewer";
	const isActiveTab = lastActiveLeaf?.id === leaf.id;
	const viewCueIndex = mapViewCueIndex(index, isLast);

	// Tab state
	const [isPinned, setIsPinned] = useState(
		leaf.getViewState().pinned ?? false
	);
	const [isEphemeral, setIsEphemeral] = useState(!!leaf.isEphemeral);
	const [volatileTitle, setVolatileTitle] = useState<string | null>(null);

	// Touch sensor for mobile
	const { listeners } = useTouchSensor({
		minDistance: 10,
		callback: (moved) => {
			if (!moved) openTab();
		},
	});

	// Register event listeners
	useEffect(() => {
		bindPinningEvent(leaf, changePinnedState);
		bindEphemeralToggleEvent(app, leaf, setIsEphemeral);
	}, [leaf.id]);

	// Handle webviewer title updates
	useEffect(() => {
		if (!isWebViewer) setVolatileTitle(null);

		if (Platform.isDesktop && isWebViewer) {
			const webview = leaf.view as BrowserView;
			if (webview.webview) {
				webview.webview.addEventListener(
					"page-title-updated",
					(data: { title: string }) => setVolatileTitle(data.title)
				);
			}
		}
	}, [isWebViewer]);

	// Track active tab for UI
	useEffect(() => {
		if (isActiveTab) {
			hookLatestActiveTab(ref.current);
		}
	}, [isActiveTab, ref]);

	// Set up view cue index
	useEffect(() => {
		const isFirstTab =
			viewCueIndex === VIEW_CUE_PREV ||
			(viewCueIndex === index && index === 1);
		registerViewCueTab(leaf, ref.current, isFirstTab);

		if (leaf.tabHeaderInnerTitleEl) {
			if (viewCueIndex) {
				leaf.tabHeaderInnerTitleEl.dataset.index =
					viewCueIndex.toString();
			} else {
				delete leaf.tabHeaderInnerTitleEl.dataset.index;
			}
		}
	}, [viewCueIndex, ref]);

	// Tab action handlers
	const changePinnedState = (pinned: boolean) => {
		setIsPinned(pinned);
		if (pinned && leaf.isEphemeral) makeLeafNonEphemeral(leaf);
	};

	const togglePinned = () => {
		leaf.togglePinned();
		changePinnedState(leaf.getViewState().pinned ?? false);
		sort();
	};

	const unPin = () => {
		leaf.setPinned(false);
		changePinnedState(false);
		sort();
	};

	const closeTab = () => {
		if (!leaf.getViewState().pinned) leaf.detach();
	};

	const openTab = () => {
		if (Platform.isMobile && isEditingTabs) return;

		const positioning =
			viewType === GroupViewType.MissionControlView ? "center" : "start";
		const focus = viewType !== GroupViewType.MissionControlView;

		workspace.setActiveLeaf(leaf, { focus });
		workspace.onLayoutChange();
		setGroupState(leaf.parent.id, { hidden: false });
		lockFocusOnLeaf(app, leaf);

		leaf.containerEl?.scrollIntoView({
			behavior: "smooth",
			block: positioning,
			inline: "center",
		});
	};

	const makeLeafNonEphemeralAndExitMissionControl = () => {
		makeLeafNonEphemeral(leaf);
		if (viewType === GroupViewType.MissionControlView) {
			setGroupViewType(leaf.parent, GroupViewType.Default);
		}
	};

	// Event callbacks
	const activeOrCloseTab = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		if (event.altKey) {
			closeTab();
		} else {
			openTab();
		}
	};

	const midClickCloseTab = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		if (event.button === 1) closeTab();
	};

	const previewTab = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		const file = getOpenFileOfLeaf(app, leaf);
		if (file && ref.current) {
			workspace.trigger("hover-link", {
				event: event.nativeEvent,
				source: "vertical-tabs",
				hoverParent: leaf,
				targetEl: ref.current,
				linktext: file.path,
			});
		}
	};

	// Context menu setup
	const menu = new Menu();

	// Bookmark section
	menu.addItem((item) => {
		item.setSection("bookmark")
			.setTitle("Bookmark")
			.onClick(() => {
				createBookmarkForLeaf(app, leaf, leaf.getDisplayText());
			});
	});
	menu.addItem((item) => {
		item.setSection("bookmark")
			.setTitle("Bookmark and close")
			.onClick(async () => {
				await createBookmarkForLeaf(app, leaf, leaf.getDisplayText());
				leaf.detach();
			});
	});

	// Group view section (only for single groups)
	if (isSingleGroup && viewType) {
		menu.addSeparator();
		menu.addItem((item) => {
			item.setSection("group-view")
				.setTitle("Default view")
				.setDisabled(viewType === GroupViewType.Default)
				.onClick(() =>
					setGroupViewType(leaf.parent, GroupViewType.Default)
				);
		});
		menu.addItem((item) => {
			item.setSection("group-view")
				.setTitle("Continuous view")
				.setDisabled(viewType === GroupViewType.ContinuousView)
				.onClick(() =>
					setGroupViewType(leaf.parent, GroupViewType.ContinuousView)
				);
		});
		menu.addItem((item) => {
			item.setSection("group-view")
				.setTitle("Column view")
				.setDisabled(viewType === GroupViewType.ColumnView)
				.onClick(() =>
					setGroupViewType(leaf.parent, GroupViewType.ColumnView)
				);
		});
		menu.addItem((item) => {
			item.setSection("group-view")
				.setTitle("Mission control view")
				.setDisabled(viewType === GroupViewType.MissionControlView)
				.onClick(() =>
					setGroupViewType(
						leaf.parent,
						GroupViewType.MissionControlView
					)
				);
		});
	}

	// Close section
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close")
			.setDisabled(isPinned)
			.onClick(() => leaf.detach());
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close Others")
			.onClick(() => {
				closeOthersInGroup(app, leaf);
				makeLeafNonEphemeral(leaf);
			});
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close tabs to the top")
			.onClick(() => closeTabsToTopInGroup(app, leaf));
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close tabs to the bottom")
			.onClick(() => closeTabsToBottomInGroup(app, leaf));
	});
	menu.addItem((item) => {
		item.setSection("close")
			.setTitle("Close all")
			.setDisabled(isPinned)
			.onClick(() => leaf.parent.detach());
	});

	// Pin section
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("pin")
			.setTitle(isPinned ? "Unpin" : "Pin")
			.onClick(togglePinned);
	});

	// Leaf manipulation section
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Move to new window")
			.onClick(() => {
				workspace.duplicateLeaf(leaf, "window");
				leaf.detach();
			});
	});
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Split right")
			.onClick(() => workspace.duplicateLeaf(leaf, "split", "vertical"));
	});
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Split down")
			.onClick(() =>
				workspace.duplicateLeaf(leaf, "split", "horizontal")
			);
	});
	menu.addItem((item) => {
		item.setSection("leaf")
			.setTitle("Open in new window")
			.onClick(() => {
				workspace.duplicateLeaf(leaf, "window");
			});
	});

	// History section
	if (leaf.view.navigation && !alwaysOpenInNewTab) {
		const historyLength =
			leaf.history.backHistory.length +
			leaf.history.forwardHistory.length;
		menu.addSeparator();
		menu.addItem((item) => {
			item.setSection("history")
				.setTitle(`Back`)
				.setDisabled(leaf.history.backHistory.length === 0)
				.onClick(() => leaf.history.back());
		});
		menu.addItem((item) => {
			item.setSection("history")
				.setTitle("Forward")
				.setDisabled(leaf.history.forwardHistory.length === 0)
				.onClick(() => leaf.history.forward());
		});
		menu.addItem((item) => {
			item.setSection("history").setTitle("Browse history");
			if (Platform.isDesktop) {
				const submenu = item.setSubmenu();
				const { backHistory, forwardHistory } = leaf.history;
				const { length } = backHistory;
				backHistory.forEach((state, index) => {
					submenu.addItem((item) => {
						item.setTitle(state.title).setChecked(false);
						item.onClick(() => leaf.history.go(index - length));
					});
				});
				submenu.addItem((item) => {
					item.setTitle(DeduplicatedTitle(app, leaf)).setChecked(
						true
					);
				});
				forwardHistory
					.slice()
					.reverse()
					.forEach((state, index) => {
						submenu.addItem((item) => {
							item.setTitle(state.title).setChecked(false);
							item.onClick(() => leaf.history.go(index + 1));
						});
					});
			} else {
				item.setDisabled(historyLength === 0);
				item.onClick(() => new HistoryBrowserModal(app, leaf).open());
			}
		});
		menu.addItem((item) => {
			item.setSection("history")
				.setTitle("Bookmark history")
				.setDisabled(historyLength === 0)
				.onClick(() => createBookmarkForLeafHistory(app, leaf));
		});
		menu.addItem((item) => {
			item.setSection("history")
				.setTitle("Open history in new group")
				.setDisabled(historyLength === 0)
				.onClick(async () => {
					const duplicatedLeaf = await workspace.duplicateLeaf(
						leaf,
						"split"
					);
					loadDeferredLeaf(duplicatedLeaf);
					duplicatedLeaf.history.backHistory = [];
					duplicatedLeaf.history.forwardHistory = [];
					const group = duplicatedLeaf.parent;
					const { backHistory, forwardHistory } = leaf.history;

					let index = 0;
					for (const state of backHistory) {
						const leaf = workspace.createLeafInParent(group, index);
						leaf.setViewState(state.state);
						await loadDeferredLeaf(leaf);
						leaf.setEphemeralState(state.eState);
						index += 1;
					}

					index += 1;
					for (const state of forwardHistory) {
						const leaf = workspace.createLeafInParent(group, index);
						leaf.setViewState(state.state);
						await loadDeferredLeaf(leaf);
						leaf.setEphemeralState(state.eState);
						index += 1;
					}

					const title = DeduplicatedTitle(app, leaf);
					setGroupState(group.id, { title: `History: ${title}` });
					workspace.setActiveLeaf(duplicatedLeaf, { focus: true });
					lockFocusOnLeaf(app, duplicatedLeaf);
				});
		});
		menu.addItem((item) => {
			item.setSection("history")
				.setTitle("Clear history")
				.setDisabled(historyLength === 0)
				.onClick(() => {
					leaf.history.backHistory = [];
					leaf.history.forwardHistory = [];
					setTimeout(
						() => refresh(app, plugin.persistenceManager),
						REFRESH_TIMEOUT
					);
				});
		});
	}

	// Deferred leaf section
	if (isDeferredLeaf(leaf) && !alwaysOpenInNewTab) {
		menu.addSeparator();
		menu.addItem((item) => {
			item.setSection("history").setTitle("(Inactive)").setDisabled(true);
		});
		menu.addItem((item) => {
			item.setSection("history")
				.setTitle("Load history")
				.onClick(async () => await loadDeferredLeaf(leaf));
		});
	}

	// Zoom section
	if (enableTabZoom && !isWebViewer) {
		menu.addSeparator();
		if (Platform.isDesktop) {
			menu.addItem((item) => {
				item.setSection("zoom").setTitle("Zoom");
				const submenu = item.setSubmenu();
				submenu.addItem((item) => {
					item.setTitle("Zoom in").onClick(() => zoomIn(leaf.view));
				});
				submenu.addItem((item) => {
					item.setTitle("Zoom out").onClick(() => zoomOut(leaf.view));
				});
				submenu.addItem((item) => {
					item.setTitle("Reset zoom").onClick(() =>
						resetZoom(leaf.view)
					);
				});
			});
		} else {
			menu.addItem((item) => {
				item.setTitle("Zoom in").onClick(() => zoomIn(leaf.view));
			});
			menu.addItem((item) => {
				item.setTitle("Zoom out").onClick(() => zoomOut(leaf.view));
			});
			menu.addItem((item) => {
				item.setTitle("Reset zoom").onClick(() => resetZoom(leaf.view));
			});
		}
	}

	// Webviewer section
	if (Platform.isDesktop && isWebViewer) {
		const webview = leaf.view as BrowserView;

		menu.addSeparator();
		menu.addItem((item) => {
			item.setSection("webview")
				.setTitle("Toggle reader mode")
				.onClick(() => webview.toggleReaderMode());
		});
		menu.addItem((item) => {
			item.setSection("webview")
				.setTitle("Save to vault")
				.onClick(async () => {
					const file = await webview.saveAsMarkdown();
					if (file) workspace.getLeaf("tab").openFile(file);
				});
		});

		menu.addSeparator();
		menu.addItem((item) => {
			item.setSection("zoom").setTitle("Zoom");
			const submenu = item.setSubmenu();
			submenu.addItem((item) => {
				item.setTitle("Zoom in").onClick(() => webview.zoomIn());
			});
			submenu.addItem((item) => {
				item.setTitle("Zoom out").onClick(() => webview.zoomOut());
			});
			submenu.addItem((item) => {
				item.setTitle("Reset zoom").onClick(() => webview.zoomReset());
			});
		});
	}

	// More options section (desktop only)
	if (Platform.isDesktop && !isWebViewer) {
		menu.addSeparator();
		menu.addItem((item) => {
			item.setSection("more").setTitle("More options");
			const submenu = item.setSubmenu();
			leaf.view.onPaneMenu(submenu, "more-options");
			const excludedSections = ["open", "find", "pane"];
			submenu.items = submenu.items.filter(
				(item) =>
					item.section === undefined ||
					!excludedSections.includes(item.section)
			);
		});
	}

	// Show context menu handler
	const showContextMenu = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => {
		if (!isSelf) menu.showAtMouseEvent(event.nativeEvent);
	};

	// Tab toolbar
	const toolbar = (
		<Fragment>
			{isPinned && (
				<IconButton
					icon="pin"
					action="unpin"
					tooltip="Unpin"
					onClick={unPin}
				/>
			)}
			{!isPinned && (
				<IconButton
					icon="x"
					action="close"
					tooltip="Close tab"
					disabled={isPinned}
					onClick={closeTab}
				/>
			)}
		</Fragment>
	);

	return (
		<NavigationTreeItem
			ref={ref}
			id={leaf.id}
			index={viewCueIndex}
			title={volatileTitle ?? DeduplicatedTitle(app, leaf)}
			isTab={true}
			isEphemeralTab={isEphemeral && !isPinned}
			isPinned={isPinned}
			isHighlighted={isActiveTab}
			toolbar={!isSelf && toolbar}
			onClick={activeOrCloseTab}
			onAuxClick={midClickCloseTab}
			onDoubleClick={makeLeafNonEphemeralAndExitMissionControl}
			onContextMenu={showContextMenu}
			onMouseOver={previewTab}
			dataType={leaf.getViewState().type}
			dataId={leaf.id}
			icon={leaf.getIcon()}
			isActive={leaf.tabHeaderEl?.classList.contains("is-active")}
			{...listeners}
		/>
	);
};
