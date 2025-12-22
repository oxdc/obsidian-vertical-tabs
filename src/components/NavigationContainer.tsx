import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { usePlugin } from "src/models/PluginContext";
import { Fragment, useEffect, useRef } from "react";
import { useViewState, ALT_KEY_EFFECT_DURATION } from "src/models/ViewState";
import { debounce, Platform } from "obsidian";
import { REFRESH_TIMEOUT, REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";
import { SwipeDirection, useTouchSensor } from "src/services/TouchSeneor";
import { getDrawer } from "src/services/MobileDrawer";
import { NativeDragTabs } from "src/services/NativeDragTabs";
import {
	shouldDisplayBetaSecurityInfo,
	verifyBetaIntegrity,
} from "src/services/Integrity";
import { autoRefresh } from "src/services/Refresh";

const TEN_MINUTES = 10 * 60 * 1000;

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const app = plugin.app;
	const ref = useRef<HTMLDivElement>(null);
	const { setAltKeyState, setIsEditingTabs } = useViewState();

	// Drag detection state using refs to persist across re-renders
	const dragInProgress = useRef(false);
	const draggedLeaf = useRef<Element | null>(null);

	// Alt key timeout reference to allow cancellation
	const altKeyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Native drag and drop service instance
	const nativeDragTabsRef = useRef<NativeDragTabs | null>(null);

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

	useEffect(() => {
		const workspace = app.workspace;

		// Initialize native drag and drop for tab rearrangement
		nativeDragTabsRef.current = new NativeDragTabs(app);
		useViewState.getState().setNativeDragTabs(nativeDragTabsRef.current);
		nativeDragTabsRef.current.initialize();
		plugin.registerEvent(
			workspace.on("layout-change", () => {
				// Refresh native drag functionality when layout changes (new tabs added/removed)
				if (nativeDragTabsRef.current) {
					app.workspace.iterateAllLeaves((leaf) => {
						nativeDragTabsRef.current?.refreshLeaf(leaf);
					});
				}
			})
		);
		plugin.registerDomEvent(window, "keydown", (event) => {
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
		});
		plugin.registerDomEvent(window, "dragstart", handleDragStart);
		plugin.registerDomEvent(window, "dragend", handleDragEnd);
		plugin.registerDomEvent(window, "drop", handleDrop);

		// Cleanup function to clear alt key timeout and native drag service on unmount
		return () => {
			if (altKeyTimeoutRef.current) {
				clearTimeout(altKeyTimeoutRef.current);
			}
			if (nativeDragTabsRef.current) {
				nativeDragTabsRef.current.cleanup();
				nativeDragTabsRef.current = null;
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

	const checkBetaSecurity = async () => {
		const isBetaVersion = await plugin.isBetaVersion();
		const shouldDisplay = await shouldDisplayBetaSecurityInfo(plugin);
		const isVerifiedBuild = await verifyBetaIntegrity(plugin);
		const insecure = isBetaVersion && shouldDisplay && !isVerifiedBuild;
		const alreadyDisplayed = ref.current?.querySelector(
			".vt-beta-security-warning-banner"
		);
		if (insecure) {
			if (alreadyDisplayed || !ref.current) return;
			ref.current.createDiv({
				cls: "vt-beta-security-warning-banner",
				attr: {
					style: `display: block !important;
					        visibility: visible !important;
					        opacity: 1 !important;
									order: -1 !important;`,
				},
				text: "Unverified beta build, insecure to use.",
			});
		} else if (alreadyDisplayed) {
			alreadyDisplayed?.remove();
		}
	};

	useEffect(() => {
		setTimeout(checkBetaSecurity);
		plugin.registerInterval(
			window.setInterval(checkBetaSecurity, TEN_MINUTES)
		);
	}, []);

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
