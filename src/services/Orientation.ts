export function updateOrientationLabel() {
	const isLandscape = window.innerWidth > window.innerHeight;
	const isPortrait = window.innerWidth <= window.innerHeight;
	activeDocument.body.toggleClass("vt-landscape", isLandscape);
	activeDocument.body.toggleClass("vt-portrait", isPortrait);
}
