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
import { REFRESH_TIMEOUT, REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";
import { byPinned } from "src/services/SortTabs";

interface TabProps {
	leaf: WorkspaceLeaf;
	index: number;
	isLast: boolean;
	isSingleGroup?: boolean;
	viewType?: GroupViewType;
}

type DivMouseEvent = React.MouseEvent<HTMLDivElement, MouseEvent>;

export const Tab = (props: TabProps) => {
	const plugin = usePlugin();
	const app = plugin.app;
	const workspace = app.workspace;

	const { leaf, index, isLast, isSingleGroup, viewType } = props;

	/* Relavent settings */
	const enableTabZoom = useSettings((state) => state.enableTabZoom);
	const alwaysOpenInNewTab = useSettings((state) => state.alwaysOpenInNewTab);
	const isEditingTabs = useViewState((state) => state.isEditingTabs);
	const sortStrategy = tabCacheStore((state) => state.sortStrategy);

	/* External states (managed by Obsidian) */
	const leafPinnedState = leaf.getViewState().pinned ?? false;
	const isWebViewer = leaf.view.getViewType() === "webviewer";

	/* Internal states (managed by the component) */
	const [isPinned, setIsPinned] = useState(leafPinnedState);
	const [isEphemeral, setIsEphemeral] = useState(!!leaf.isEphemeral);
	const [volatileTitle, setVolatileTitle] = useState<string | null>(null);

	/* Store states (managed by zustand, shared by components) */
	const lastActiveLeaf = useViewState((state) => state.latestActiveLeaf);

	/* Actions (for mutating the shared store) */
	const { refresh, sort } = tabCacheStore.getActions();
	const {
		bindPinningEvent,
		bindEphemeralToggleEvent,
		setGroupTitle,
		lockFocusOnLeaf,
		toggleHiddenGroup,
		hookLatestActiveTab,
		mapViewCueIndex,
		registerViewCueTab,
	} = useViewState();

	/* Commands */
	/* Commands - Tab control */
	const previewTab = (event: DivMouseEvent) => {
		const file = getOpenFileOfLeaf(app, leaf);
		if (file && ref.current) {
			// Signal Obsidian to show the preview
			workspace.trigger("hover-link", {
				event: event.nativeEvent,
				source: "vertical-tabs",
				hoverParent: leaf,
				targetEl: ref.current,
				linktext: file.path,
			});
		}
	};
	// openTab activates the tab and scrolls it into view
	const openTab = () => {
		// Disable when editing tabs on mobile, preventing the sidebar from being closed
		if (Platform.isMobile && isEditingTabs) return;
		// Signal the changes to Obsidian
		const focus = viewType !== GroupViewType.MissionControlView;
		workspace.setActiveLeaf(leaf, { focus });
		workspace.onLayoutChange();
		// Automatically unhide the group containing the tab
		toggleHiddenGroup(leaf.parent.id, false);
		// Lock the focus for Zen mode
		lockFocusOnLeaf(app, leaf);
		// Center the tab in the mission control view
		const positioning =
			viewType === GroupViewType.MissionControlView ? "center" : "start";
		leaf.containerEl?.scrollIntoView({
			behavior: "smooth",
			block: positioning,
			inline: "center",
		});
	};
	// closeTab detaches only unpinned tabs
	const closeTab = () => {
		if (!isPinned) leaf.detach();
	};
	// Convenience wrapper
	const midClickCloseTab = (event: DivMouseEvent) => {
		if (event.button === 1) closeTab();
	};
	// Alt-click closes the tab, otherwise opens it
	const activeOrCloseTab = (event: DivMouseEvent) => {
		if (event.altKey) {
			closeTab();
		} else {
			openTab();
		}
	};
	// Double clicking a tab makes it non-ephemeral and exits the mission control view
	const makeLeafNonEphemeralAndExitMissionControl = () => {
		makeLeafNonEphemeral(leaf);
		if (viewType === GroupViewType.MissionControlView) {
			setGroupViewType(leaf.parent, GroupViewType.Default);
		}
	};

	/* Commands - Pinning */
	// setPinnedStates updates the states managed by the plugin,
	// including internal and store states.
	const setPinnedStates = (pinned: boolean) => {
		// Internal state always reflects the change
		setIsPinned(pinned);
		// Tab becomes non-ephemeral if pinned
		if (pinned && leaf.isEphemeral) makeLeafNonEphemeral(leaf);
	};
	// setPinned updates the states and fires events for side effects.
	const setPinned = (pinned: boolean) => {
		// Signal the change to Obsidian
		leaf.setPinned(pinned);
		// Update the states
		setPinnedStates(pinned);
		// Sort by pinned state, if specified by the user
		if (sortStrategy?.compareFn === byPinned) sort();
	};
	// Convenience wrappers
	const togglePinned = () => setPinned(!isPinned);
	const unPin = () => setPinned(false);

	/* Commands - History */
	const addHistoryBrowserToMenu = (leaf: WorkspaceLeaf, submenu: Menu) => {
		const { backHistory, forwardHistory } = leaf.history;
		const { length } = backHistory;
		const reversedForwardHistory = forwardHistory.slice().reverse();
		backHistory.forEach((state, index) => {
			submenu.addItem((item) => {
				item.setTitle(state.title).setChecked(false);
				item.onClick(() => leaf.history.go(index - length));
			});
		});
		submenu.addItem((item) => {
			item.setTitle(DeduplicatedTitle(app, leaf)).setChecked(true);
		});
		reversedForwardHistory.forEach((state, index) => {
			submenu.addItem((item) => {
				item.setTitle(state.title).setChecked(false);
				item.onClick(() => leaf.history.go(index + 1));
			});
		});
	};
	const openHistoryInNewGroup = async () => {
		// Make a copy of the current tab in a new group
		const duplicatedLeaf = await workspace.duplicateLeaf(leaf, "split");
		// Force it to be loaded
		loadDeferredLeaf(duplicatedLeaf);
		// Reset the new tab's history
		duplicatedLeaf.history.backHistory = [];
		duplicatedLeaf.history.forwardHistory = [];
		// And open the tabs contained in the group
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
		index += 1; // Skip the current tab
		for (const state of forwardHistory) {
			const leaf = workspace.createLeafInParent(group, index);
			leaf.setViewState(state.state);
			await loadDeferredLeaf(leaf);
			leaf.setEphemeralState(state.eState);
			index += 1;
		}
		// Set the group title
		const title = DeduplicatedTitle(app, leaf);
		setGroupTitle(group.id, `History: ${title}`);
		// Activate the new tab and lock the focus
		workspace.setActiveLeaf(duplicatedLeaf, { focus: true });
		lockFocusOnLeaf(app, duplicatedLeaf);
	};

	/* Commands - Zoom */
	const addZoomOptionsToMenu = (
		target: WorkspaceLeaf | BrowserView,
		menu: Menu
	) => {
		const _ZoomIn =
			target instanceof WorkspaceLeaf
				? () => zoomIn(target.view)
				: () => target.zoomIn();
		const _ZoomOut =
			target instanceof WorkspaceLeaf
				? () => zoomOut(target.view)
				: () => target.zoomOut();
		const _ResetZoom =
			target instanceof WorkspaceLeaf
				? () => resetZoom(target.view)
				: () => target.zoomReset();
		menu.addItem((item) => item.setTitle("Zoom in").onClick(_ZoomIn));
		menu.addItem((item) => item.setTitle("Zoom out").onClick(_ZoomOut));
		menu.addItem((item) => item.setTitle("Reset zoom").onClick(_ResetZoom));
	};

	/* Commands - Webview */
	const saveAsMarkdown = async (view: BrowserView) => {
		const file = await view.saveAsMarkdown();
		if (file) workspace.getLeaf("tab").openFile(file);
	};

	/* Effects */
	// Bind and track the events that used for syncing with Obsidian,
	// when the states are changed outside of the component.
	useEffect(() => {
		bindPinningEvent(leaf, setPinnedStates);
		bindEphemeralToggleEvent(app, leaf, setIsEphemeral);
	}, [leaf.id]);
	// volatileTitle is used for syncing with the webview title.
	useEffect(() => {
		// When the tab is reused for a non-webview view, we need to reset it.
		if (!isWebViewer) setVolatileTitle(null);
		// If it's a webview, we update the volatile title whenever the page title is changed
		if (Platform.isDesktop && isWebViewer) {
			const view = leaf.view as BrowserView;
			view.webview?.addEventListener(
				"page-title-updated",
				(data: { title: string }) => setVolatileTitle(data.title)
			);
		}
	}, [isWebViewer]);

	/* Menu */
	const menu = new Menu();
	// Bookmark
	// TODO: Add customizable title support for bookmarks
	menu.addItem((item) => {
		item.setSection("bookmark")
			.setTitle("Bookmark")
			.onClick(() =>
				createBookmarkForLeaf(app, leaf, leaf.getDisplayText())
			);
	});
	menu.addItem((item) => {
		item.setSection("bookmark")
			.setTitle("Bookmark and close")
			.onClick(async () => {
				await createBookmarkForLeaf(app, leaf, leaf.getDisplayText());
				leaf.detach();
			});
	});
	// Show group view options when there's only one group and only tabs are visible
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
	// Tab control
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
	// Pinning
	menu.addSeparator();
	menu.addItem((item) => {
		item.setSection("pin")
			.setTitle(isPinned ? "Unpin" : "Pin")
			.onClick(togglePinned);
	});
	// Workspace control
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
	// If the tab is navigatable, show history options
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
				// On desktop, we show tab history in a submenu
				const submenu = item.setSubmenu();
				addHistoryBrowserToMenu(leaf, submenu);
			} else {
				// On mobile, we show it as a modal (submenus are not supported)
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
				.onClick(openHistoryInNewGroup);
		});
		menu.addItem((item) => {
			item.setSection("history")
				.setTitle("Clear history")
				.setDisabled(historyLength === 0)
				.onClick(() => {
					leaf.history.backHistory = [];
					leaf.history.forwardHistory = [];
					setTimeout(() => refresh(app), REFRESH_TIMEOUT);
				});
		});
	}
	// Placeholder for deferred (inactive) tabs
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
	// Per-tab zoom
	if (enableTabZoom) {
		menu.addSeparator();
		if (Platform.isDesktop) {
			// On desktop, we show zoom options in a submenu
			menu.addItem((item) => {
				item.setSection("zoom").setTitle("Zoom");
				const submenu = item.setSubmenu();
				if (isWebViewer) {
					const view = leaf.view as BrowserView;
					addZoomOptionsToMenu(view, submenu);
				} else {
					addZoomOptionsToMenu(leaf, submenu);
				}
			});
		} else {
			// On mobile, we add them directly to the parent menu (submenus are not supported)
			addZoomOptionsToMenu(leaf, menu);
		}
	}
	// Show tab options
	if (Platform.isDesktop) {
		menu.addSeparator();
		menu.addItem((item) => {
			item.setSection("more").setTitle("More options");
			const submenu = item.setSubmenu();
			if (isWebViewer) {
				const webview = leaf.view as BrowserView;
				submenu.addItem((item) => {
					item.setSection("webview")
						.setTitle("Toggle reader mode")
						.onClick(() => webview.toggleReaderMode());
				});
				submenu.addItem((item) => {
					item.setSection("webview")
						.setTitle("Save to vault")
						.onClick(() => saveAsMarkdown(webview));
				});
			} else {
				// For non-webview tabs, we copy those provided by Obsidian
				leaf.view.onPaneMenu(submenu, "more-options");
				const excludedSections = ["open", "find", "pane"];
				submenu.items = submenu.items.filter(
					(item) =>
						item.section === undefined ||
						!excludedSections.includes(item.section)
				);
			}
		});
	}

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

	const [webviewIcon, setWebviewIcon] = useState<string | undefined>();

	const { listeners } = useTouchSensor({
		minDistance: 10,
		callback: (moved) => {
			if (!moved) openTab();
		},
	});

	const isActiveTab = lastActiveLeaf?.id === leaf.id;
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isActiveTab) {
			hookLatestActiveTab(ref.current);
		}
	}, [isActiveTab, ref]);

	const observer = new MutationObserver((mutationList) => {
		for (const mutation of mutationList) {
			if (mutation.type === "attributes" && mutation.attributeName) {
				const src = (mutation.target as HTMLImageElement)?.src;
				if (!src) continue;
				setWebviewIcon(src);
			}
		}
	});

	let faviconInterval: ReturnType<typeof setInterval> | null = null;

	const observeFavicon = () => {
		const view = leaf.view as BrowserView;

		// Exit early if not in webview or blank mode
		if (view?.mode !== "webview" && view?.mode !== "blank") {
			setWebviewIcon(undefined);
			return;
		}

		// Set up polling interval if favicon element isn't available yet
		if (!view?.faviconImgEl?.children.length) {
			if (!webviewIcon && faviconInterval === null) {
				faviconInterval = setInterval(
					observeFavicon,
					REFRESH_TIMEOUT_LONG
				);
			}
			return;
		}

		// Clean up existing observation and interval
		observer.disconnect();
		if (faviconInterval) {
			clearInterval(faviconInterval);
			faviconInterval = null;
		}

		// Set up new observation on favicon element
		observer.observe(view.faviconImgEl, {
			attributes: true,
			subtree: true,
		});

		// Update webview icon from the favicon image
		const img = view.faviconImgEl.children[0] as HTMLImageElement;
		setWebviewIcon(img.src);
	};

	useEffect(observeFavicon, [isActiveTab, volatileTitle]);

	const viewCueIndex = mapViewCueIndex(index, isLast);

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
			toolbar={toolbar}
			onClick={activeOrCloseTab}
			onAuxClick={midClickCloseTab}
			onDoubleClick={makeLeafNonEphemeralAndExitMissionControl}
			onContextMenu={(e) => menu.showAtMouseEvent(e.nativeEvent)}
			onMouseOver={previewTab}
			dataType={leaf.getViewState().type}
			dataId={leaf.id}
			webviewIcon={webviewIcon}
			icon={leaf.getIcon()}
			isActive={leaf.tabHeaderEl?.classList.contains("is-active")}
			{...listeners}
		/>
	);
};
