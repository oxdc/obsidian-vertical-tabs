import { createContext } from "react";
import { App } from "obsidian";
import ObsidianVerticalTabs from "main";
import { Optional } from "./utils/optional";

export class AppContextContent {
	app: App;
	plugin: ObsidianVerticalTabs;
}

export const AppContext = createContext<Optional<AppContextContent>>(undefined);
