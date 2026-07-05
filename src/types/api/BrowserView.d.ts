export {};

declare module "obsidian-typings" {
	interface Webview {
		addEventListener: (type: string, listener: unknown) => void;
	}

	interface WebviewerView {
		mode?: string;
		faviconImgEl?: HTMLDivElement;
		webview: Webview;
	}
}
