import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { useEffect } from "react";
import { useViewState } from "src/models/ViewState";
import * as VT from "src/models/VTWorkspace";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const { refresh, sort } = useTabCache();
	const {
		setActiveLeaf,
		insertToggleButtons,
		lockFocus,
		updatePositionLabels,
	} = useViewState();
	const loadSettings = useSettings.use.loadSettings();
	const toggleZenMode = useSettings.use.toggleZenMode();

	const autoRefresh = () => {
		setActiveLeaf(plugin);
		insertToggleButtons(plugin.app);
		updatePositionLabels();
		setTimeout(() => {
			refresh(plugin.app);
			sort();
		}, REFRESH_TIMEOUT);
	};

	const updateToggles = () => {
		setTimeout(() => {
			updatePositionLabels();
		}, REFRESH_TIMEOUT);
	};

	useEffect(() => {
		const workspace = plugin.app.workspace as VT.Workspace;
		loadSettings(plugin);
		autoRefresh();
		plugin.registerEvent(workspace.on("layout-change", autoRefresh));
		plugin.registerEvent(workspace.on("active-leaf-change", autoRefresh));
		plugin.registerEvent(
			workspace.on("vertical-tabs:update-toggle", updateToggles)
		);
		plugin.addCommand({
			id: "toggle-zen-mode",
			name: "Toggle zen mode",
			callback: () => {
				toggleZenMode();
				lockFocus(plugin);
			},
		});
	}, []);

	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent />
		</div>
	);
};
