import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { usePlugin } from "src/models/PluginContext";
import { Fragment, useEffect, useRef } from "react";
import { useViewState } from "src/models/ViewState";
import { debounce, Platform } from "obsidian";
import { REFRESH_TIMEOUT } from "src/constants/Timeouts";
import { SwipeDirection, useTouchSensor } from "src/services/TouchSeneor";
import { getDrawer } from "src/services/MobileDrawer";
import {
	shouldDisplayBetaSecurityInfo,
	verifyBetaIntegrity,
} from "src/services/Integrity";

const TEN_MINUTES = 10 * 60 * 1000;

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const app = plugin.app;
	const ref = useRef<HTMLDivElement>(null);
	const { setIsEditingTabs } = useViewState();

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
