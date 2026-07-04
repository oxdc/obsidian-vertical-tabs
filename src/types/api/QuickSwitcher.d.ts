import { SuggestModal, TFile } from "obsidian";

export {};

declare module "obsidian-typings" {
	interface QuickSwitcherItem {
		type: "file";
		file?: TFile;
	}

	interface SwitcherPluginInstance {
		QuickSwitcherModal: typeof SuggestModal<QuickSwitcherItem>;
	}
}
