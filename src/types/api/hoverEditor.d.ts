import { WorkspaceSplit } from "obsidian";

declare module "obsidian-typings" {
	interface PluginsPluginsRecord {
		"obsidian-hover-editor": {
			activePopovers: {
				rootSplit?: WorkspaceSplit;
			}[];
		};
	}
}
