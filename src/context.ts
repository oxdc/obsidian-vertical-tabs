import { createContext } from "react";
import ObsidianVerticalTabs from "./main";

export const PluginContext = createContext<ObsidianVerticalTabs | null>(null);
