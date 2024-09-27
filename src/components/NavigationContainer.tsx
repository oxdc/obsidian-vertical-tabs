import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { useEffect } from "react";
import { useViewState } from "src/models/ViewState";
import * as VT from "src/models/VTWorkspace";
import { debounce } from "obsidian";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const { refresh, sort } = useTabCache();
	const { setLatestActiveLeaf, refreshToggleButtons, lockFocus } =
		useViewState();
	const loadSettings = useSettings.use.loadSettings();
	const toggleZenMode = useSettings.use.toggleZenMode();

	const autoRefresh = () => {
		setLatestActiveLeaf(plugin);
		refreshToggleButtons(plugin.app);
		setTimeout(() => {
			refresh(plugin.app);
			sort();
		}, REFRESH_TIMEOUT);
	};

	const updateToggles = () => {
		setTimeout(() => {
			refreshToggleButtons(plugin.app);
		}, REFRESH_TIMEOUT);
	};

	useEffect(() => {
		const workspace = plugin.app.workspace as VT.Workspace;
		loadSettings(plugin);
		autoRefresh();
		plugin.registerEvent(workspace.on("layout-change", autoRefresh));
		plugin.registerEvent(workspace.on("active-leaf-change", autoRefresh));
		plugin.registerEvent(workspace.on("resize", debounce(updateToggles)));
		plugin.registerEvent(
			workspace.on("vertical-tabs:update-toggle", updateToggles)
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
