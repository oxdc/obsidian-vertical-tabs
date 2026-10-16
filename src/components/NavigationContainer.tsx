import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { usePlugin } from "src/models/PluginContext";
import { Fragment, MouseEvent, useRef } from "react";
import { useViewState } from "src/models/ViewState";
import { debounce, Platform } from "obsidian";
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";
import { SwipeDirection, useTouchSensor } from "src/services/TouchSeneor";
import { getDrawer } from "src/services/MobileDrawer";

export const NavigationContainer = () => {
	const app = usePlugin().app;
	const ref = useRef<HTMLDivElement>(null);
	const { setIsEditingTabs } = useViewState();

	const disableMiddleClickScrolling = (event: MouseEvent) => {
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
					window.setTimeout(
						() => leftSplit.collapse(),
						REFRESH_TIMEOUT
					);
				} else if (
					rightSplit === drawer.contained &&
					direction === SwipeDirection.Right
				) {
					disableEditingMode();
					window.setTimeout(
						() => rightSplit.collapse(),
						REFRESH_TIMEOUT
					);
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
