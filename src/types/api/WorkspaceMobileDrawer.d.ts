import "obsidian";

export {};

declare module "obsidian" {
	interface WorkspaceMobileDrawer {
		isPinned?: boolean;
	}
}
