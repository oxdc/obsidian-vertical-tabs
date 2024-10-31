import { requireApiVersion, WorkspaceLeaf } from "obsidian";

export function isDeferredLeaf(leaf: WorkspaceLeaf): boolean {
	if (requireApiVersion("1.7.2")) {
		return leaf.isDeferred;
	}
	return false;
}

export async function loadDeferredLeaf(leaf: WorkspaceLeaf) {
	if (requireApiVersion("1.7.2")) {
		await leaf.loadIfDeferred();
	}
}
