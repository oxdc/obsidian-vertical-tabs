import { createContext } from "react";
import { App } from "obsidian";

export const AppContext = createContext<App | undefined>(undefined);
