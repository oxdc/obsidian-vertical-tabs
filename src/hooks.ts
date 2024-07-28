import { useContext } from "react";
import { PluginContext } from "./context";
import ObsidianVerticalTabs from "./main";

export const usePlugin = (): ObsidianVerticalTabs => {
	const plugin = useContext(PluginContext);
	if (!plugin)
		throw new Error(
			"usePlugin must be used within a PluginContext.Provider"
		);
	return plugin;
};
