export {};

declare module "obsidian" {
	interface Menu {
		isVTMenu?: boolean;
		VTMenuAttribute?: string;
	}

	interface MenuItem {
		VTMenuAction?: string;
	}
}
