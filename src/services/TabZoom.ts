import { View } from "obsidian";

export function getZoomFactor(view: View): number {
	const zoom = view.getEphemeralState().zoom;
	if (typeof zoom === "number") return zoom;
	return 1;
}

export function setZoomFactor(view: View, zoomFactor: number) {
	if (zoomFactor <= 0) return;
	const eState = view.getEphemeralState();
	view.setEphemeralState({ ...eState, zoom: zoomFactor });
}

export function zoomIn(view: View) {
	const zoom = getZoomFactor(view) + 0.1;
	setZoomFactor(view, zoom);
}

export function zoomOut(view: View) {
	const zoom = getZoomFactor(view) - 0.1;
	setZoomFactor(view, zoom);
}

export function resetZoom(view: View) {
	setZoomFactor(view, 1);
}
