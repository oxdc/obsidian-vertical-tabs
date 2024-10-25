import { requireApiVersion, WorkspaceLeaf } from "obsidian";

export async function loadDeferredLeaf(leaf: WorkspaceLeaf) {
	if (requireApiVersion("1.7.2")) {
		await leaf.loadIfDeferred();
	}
}
