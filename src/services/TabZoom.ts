import { View } from "obsidian";

export const ZOOM_STEP = 0.1;
export const ZOOM_FACTOR_TOLERANCE = 0.01;
export const MIN_ZOOM = 0.3;
export const MAX_ZOOM = 3;

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

export function getZoomFactor(view: View): number {
	const zoom = view.getEphemeralState().zoom;
	if (typeof zoom === "number") return zoom;
	return 1;
}

export function setZoomFactor(view: View, zoomFactor: number) {
	if (zoomFactor <= 0) return;
	const eState = view.getEphemeralState();
	view.setEphemeralState({
		...eState,
		zoom: clamp(zoomFactor, MIN_ZOOM, MAX_ZOOM),
	});
}

export function zoomIn(view: View) {
	const zoom = getZoomFactor(view) + ZOOM_STEP;
	setZoomFactor(view, zoom);
}

export function zoomOut(view: View) {
	const zoom = getZoomFactor(view) - ZOOM_STEP;
	setZoomFactor(view, zoom);
}

export function resetZoom(view: View) {
	setZoomFactor(view, 1);
}
