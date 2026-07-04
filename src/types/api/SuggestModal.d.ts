export {};

declare module "obsidian" {
	interface SuggestModal {
		chooser: {
			setSelectedItem: (index: number, event?: KeyboardEvent) => void;
		};
	}
}
