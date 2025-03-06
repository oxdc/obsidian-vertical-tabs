export {};

declare module "obsidian" {
	interface WorkspaceLeaf {
		isEphemeral?: boolean;
		isLinkedFile?: boolean;
		guessedCreationTime?: number;
	}
}
