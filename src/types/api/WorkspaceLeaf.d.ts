export {};

declare module "obsidian" {
	interface WorkspaceLeaf {
		pinned?: boolean;
		isVisible(): boolean;
		canNavigate(): boolean;
		getHistoryState(): HistoryState;
		history: {
			backHistory: HistoryState[];
			forwardHistory: HistoryState[];
			back(): void;
			forward(): void;
			go(offset: number): void;
		};
	}
}
