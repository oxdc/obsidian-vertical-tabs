import { WorkspaceSplit, Plugin } from "obsidian";

export {};

declare module "obsidian-typings" {
	interface ActivePopover {
		rootSplit?: WorkspaceSplit;
	}

	interface ObsidianHoverEditorPlugin extends Plugin {
		activePopovers: ActivePopover[];
	}

	interface PluginsPluginsRecord {
		"obsidian-hover-editor": ObsidianHoverEditorPlugin;
	}
}
