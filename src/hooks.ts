import { useContext } from "react";
import { AppContext, AppContextContent } from "./context";
import { App } from "obsidian";
import ObsidianVerticalTabs from "main";

function useNonNullContext(): AppContextContent {
	const context = useContext(AppContext);
	if (!context) {
		throw new Error("App context not found");
	}
	return context;
}

export const useApp = (): App => {
	return useNonNullContext().app;
};

export const usePlugin = (): ObsidianVerticalTabs => {
	return useNonNullContext().plugin;
};
