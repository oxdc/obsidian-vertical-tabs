import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin, useSettings } from "src/models/PluginContext";
import { useEffect } from "react";
import { useViewState } from "src/models/ViewState";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const { refresh, sort } = useTabCache();
	const { setLatestActiveLeaf, insertToggleButtons, lockFocus } =
		useViewState();
	const loadSettings = useSettings.use.loadSettings();
	const toggleZenMode = useSettings.use.toggleZenMode();

	const autoRefresh = () => {
		setLatestActiveLeaf(plugin);
		insertToggleButtons(plugin.app);
		setTimeout(() => {
			refresh(plugin.app);
			sort();
		}, REFRESH_TIMEOUT);
	};

	useEffect(() => {
		loadSettings(plugin);
		autoRefresh();
		plugin.registerEvent(
			plugin.app.workspace.on("layout-change", autoRefresh)
		);
		plugin.registerEvent(
			plugin.app.workspace.on("active-leaf-change", autoRefresh)
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
