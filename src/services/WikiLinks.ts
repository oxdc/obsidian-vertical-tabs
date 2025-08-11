import { App, TFile, WorkspaceLeaf } from "obsidian";
import { getOpenFileOfLeaf } from "./GetTabs";

export function getWikiLink(app: App, file: TFile) {
	const link = app.metadataCache.fileToLinktext(file, file.path);
	return link != file.basename
		? `[[${link}|${file.basename}]]`
		: `[[${link}]]`;
}

export function getWikiLinkFromLeaf(app: App, leaf: WorkspaceLeaf) {
	const file = getOpenFileOfLeaf(app, leaf);
	return file ? getWikiLink(app, file) : null;
}

export function getEmbedLink(app: App, file: TFile) {
	return `!${getWikiLink(app, file)}`;
}

export function getEmbedLinkFromLeaf(app: App, leaf: WorkspaceLeaf) {
	const file = getOpenFileOfLeaf(app, leaf);
	return file ? getEmbedLink(app, file) : null;
}
