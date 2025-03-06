export {};

declare module "obsidian" {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	interface SuggestModal<T> {
		chooser: {
			setSelectedItem: (index: number) => void;
		};
	}
}
