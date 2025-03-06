export {};

declare module "obsidian" {
	interface FileView {
		isDetachingFromVT?: boolean;
	}
}
