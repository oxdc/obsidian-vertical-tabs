import { createContext, useContext } from "react";
import { App } from "obsidian";

export const AppContext = createContext<App | null>(null);

export const useApp = (): App => {
	const app = useContext(AppContext);
	if (!app) throw new Error("AppContext not found");
	return app;
};
