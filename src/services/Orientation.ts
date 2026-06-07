export function updateOrientationLabel() {
	const isLandscape = window.innerWidth > window.innerHeight;
	const isPortrait = window.innerWidth <= window.innerHeight;
	document.body.toggleClass("vt-landscape", isLandscape);
	document.body.toggleClass("vt-portrait", isPortrait);
}
