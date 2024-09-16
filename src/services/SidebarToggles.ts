type OrElement = Element | null;

export function getHeaderContainer(container: OrElement): OrElement {
	return container?.querySelector(".workspace-tab-header-container") ?? null;
}

export function hasLeftSidebarToggle(container: OrElement): boolean {
	const headerContainer = getHeaderContainer(container);
	return (
		headerContainer?.querySelector(".sidebar-toggle-button.mod-left") !==
		null
	);
}

export function hasRightSidebarToggle(container: OrElement): boolean {
	const headerContainer = getHeaderContainer(container);
	return (
		headerContainer?.querySelector(".sidebar-toggle-button.mod-right") !==
		null
	);
}

export function insertLeftSidebarToggle(
	container: OrElement,
	leftButtonClone: OrElement
): void {
	const headerContainer = getHeaderContainer(container);
	if (headerContainer && leftButtonClone) {
		headerContainer.prepend(leftButtonClone);
	}
}

export function insertRightSidebarToggle(
	container: OrElement,
	rightButtonClone: OrElement
): void {
	const headerContainer = getHeaderContainer(container);
	if (headerContainer && rightButtonClone) {
		headerContainer.appendChild(rightButtonClone);
	}
}
