export {};

declare module "obsidian" {
	interface WorkspaceParent {
		isLinkedGroup?: boolean;
	}
}
