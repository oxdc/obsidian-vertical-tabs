export {};

declare module "obsidian-typings" {
	interface Webview {
		addEventListener: (type: string, listener: unknown) => void;
	}

	interface WebviewerView {
		webview: Webview;
		mode: string;
		faviconImgEl: HTMLElement | undefined;
	}
}
