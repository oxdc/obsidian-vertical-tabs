export {};

declare module "obsidian" {
	interface PluginManifest {
		isBeta?: boolean;
		timestamp?: string;
		files?: Record<string, string>;
	}
}
