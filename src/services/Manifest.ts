import { PluginManifest } from "obsidian";

export interface VerticalTabsManifest extends PluginManifest {
	isBeta?: boolean;
	timestamp?: string;
	files?: Record<string, string>;
}
