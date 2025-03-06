import { SuggestModal, QuickSwitcherItem } from "obsidian";

export {};

declare module "obsidian-typings" {
	interface SwitcherPluginInstance {
		QuickSwitcherModal: typeof SuggestModal<QuickSwitcherItem>;
	}
}
