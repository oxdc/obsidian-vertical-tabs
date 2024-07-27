import { createContext } from "react";
import { TabManager } from "./models/TabManager";

export const TabManagerContext = createContext<TabManager | null>(null);
