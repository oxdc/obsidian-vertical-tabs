export {};

declare module "obsidian" {
	interface SyncViewState {
		active: boolean;
		state: ViewState;
		eState: unknown;
	}

	interface FileView {
		getSyncViewState(): SyncViewState;
	}
}
