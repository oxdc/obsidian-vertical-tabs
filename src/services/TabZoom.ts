import { WorkspaceLeaf } from "obsidian";

export function getZoomFactor(leaf: WorkspaceLeaf) {
	return leaf.getEphemeralState().zoom;
}

export function setZoomFactor(leaf: WorkspaceLeaf, zoomFactor: number) {
	if (zoomFactor <= 0) return;
	const eState = leaf.getEphemeralState();
	leaf.setEphemeralState({ ...eState, zoom: zoomFactor });
}

export function zoomIn(leaf: WorkspaceLeaf) {
	const zoom = getZoomFactor(leaf) + 0.1;
	setZoomFactor(leaf, zoom);
}

export function zoomOut(leaf: WorkspaceLeaf) {
	const zoom = getZoomFactor(leaf) - 0.1;
	setZoomFactor(leaf, zoom);
}

export function resetZoom(leaf: WorkspaceLeaf) {
	setZoomFactor(leaf, 1);
}
