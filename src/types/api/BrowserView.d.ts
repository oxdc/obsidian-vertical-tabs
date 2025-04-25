import { TFile } from "obsidian";

export {};

declare module "obsidian-typings" {
	interface Webview {
		addEventListener: (type: string, listener: unknown) => void;
	}

	interface BrowserView {
		mode?: string;
		faviconImgEl?: HTMLDivElement;
		faviconUrl?: string;
		inProgressPageLoad?: object;
		saveAsMarkdown(): Promise<TFile | null>;
		webview: Webview;
	}
}
