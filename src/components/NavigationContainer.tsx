import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin } from "src/models/PluginContext";
import { useEffect } from "react";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const { tabs, refresh } = useTabCache();

	const autoRefresh = () => {
		setTimeout(() => refresh(plugin.app), REFRESH_TIMEOUT);
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
			<NavigationContent tabs={tabs} />
		</div>
	);
};
