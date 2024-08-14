import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin } from "src/models/PluginContext";
import { useEffect } from "react";
import { useViewState } from "src/models/ViewState";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const { refresh, sort } = useTabCache();
	const { setActiveLeaf, insertToggleButtons } = useViewState();

	const autoRefresh = () => {
		setActiveLeaf(plugin);
		insertToggleButtons(plugin.app);
		setTimeout(() => {
			refresh(plugin.app);
			sort();
		}, REFRESH_TIMEOUT);
	};

	useEffect(() => {
		autoRefresh();
		plugin.registerEvent(
			plugin.app.workspace.on("layout-change", autoRefresh)
		);
		plugin.registerEvent(
			plugin.app.workspace.on("active-leaf-change", autoRefresh)
		);
	}, []);

	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent />
		</div>
	);
};
