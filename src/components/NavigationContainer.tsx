import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { useTabCache } from "src/models/TabCache";
import { usePlugin } from "src/models/PluginContext";
import { useEffect } from "react";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const { tabs, refresh } = useTabCache();

	useEffect(() => {
		refresh(plugin.app);
		plugin.app.workspace.on("layout-change", () => {
			refresh(plugin.app);
		});
		plugin.app.workspace.on("active-leaf-change", () => {
			refresh(plugin.app);
		});
	}, []);

	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent tabs={tabs} />
		</div>
	);
};
