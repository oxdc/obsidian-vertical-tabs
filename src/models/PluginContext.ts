import { createContext, useContext } from "react";
import ObsidianVerticalTabs from "src/main";

export const PluginContext = createContext<ObsidianVerticalTabs | null>(null);

export const usePlugin = (): ObsidianVerticalTabs => {
	const plugin = useContext(PluginContext);
	if (!plugin) throw new Error("PluginContext not found");
	return plugin;
};
