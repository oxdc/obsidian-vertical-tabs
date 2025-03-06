import { TFile } from "obsidian";

export {};

declare module "obsidian-typings" {
	interface Webview {
		addEventListener: (type: string, listener: unknown) => void;
	}

	interface BrowserView {
		saveAsMarkdown(): Promise<TFile | null>;
		webview: Webview;
	}
}
