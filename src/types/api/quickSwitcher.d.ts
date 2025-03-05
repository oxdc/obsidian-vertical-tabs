import { SuggestModal, QuickSwitcherItem } from "obsidian";

declare module "obsidian-typings" {
	interface SwitcherPluginInstance {
		QuickSwitcherModal: typeof SuggestModal<QuickSwitcherItem>;
	}
}
