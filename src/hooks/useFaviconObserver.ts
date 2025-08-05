import { useEffect, useRef } from "react";
import { WorkspaceLeaf } from "obsidian";
import { BrowserView } from "obsidian-typings";
import { REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";

interface UseFaviconObserverProps {
	leaf: WorkspaceLeaf;
	webviewIcon: string | undefined;
	setWebviewIcon: (icon: string | undefined) => void;
	isActiveTab: boolean;
	volatileTitle: string | null;
}

export const useFaviconObserver = (props: UseFaviconObserverProps) => {
	const { leaf, webviewIcon, setWebviewIcon, isActiveTab, volatileTitle } =
		props;

	const observerRef = useRef<MutationObserver | null>(null);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const observeFavicon = () => {
			const view = leaf.view as BrowserView;

			// Exit early if not in webview or blank mode
			if (view?.mode !== "webview" && view?.mode !== "blank") {
				setWebviewIcon(undefined);
				return;
			}

			// Set up polling interval if favicon element isn't available yet
			if (!view?.faviconImgEl?.children.length) {
				if (!webviewIcon && intervalRef.current === null) {
					intervalRef.current = setInterval(
						observeFavicon,
						REFRESH_TIMEOUT_LONG
					);
				}
				return;
			}

			// Clean up existing observation and interval
			if (observerRef.current) {
				observerRef.current.disconnect();
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}

			// Create and set up new observer
			observerRef.current = new MutationObserver((mutationList) => {
				for (const mutation of mutationList) {
					if (
						mutation.type === "attributes" &&
						mutation.attributeName
					) {
						const src = (mutation.target as HTMLImageElement)?.src;
						if (!src) continue;
						setWebviewIcon(src);
					}
				}
			});

			// Set up new observation on favicon element
			observerRef.current.observe(view.faviconImgEl, {
				attributes: true,
				subtree: true,
			});

			// Update webview icon from the favicon image
			const img = view.faviconImgEl.children[0] as HTMLImageElement;
			setWebviewIcon(img.src);
		};

		observeFavicon();
	}, [isActiveTab, volatileTitle, leaf, webviewIcon, setWebviewIcon]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (observerRef.current) observerRef.current.disconnect();
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, []);
};
