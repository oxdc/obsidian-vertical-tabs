import { setIcon, WorkspaceLeaf } from "obsidian";

export function addPinnedIndicator(
	leaf: WorkspaceLeaf,
	isPinned: boolean,
	onToggle: () => void
) {
	if (!leaf.containerEl) return;

	let pinnedIndicator = leaf.containerEl.querySelector(
		".vt-pinned-indicator"
	) as HTMLElement;

	if (!pinnedIndicator) {
		pinnedIndicator = leaf.containerEl.createDiv("vt-pinned-indicator");
		setIcon(pinnedIndicator, "pin");
		pinnedIndicator.addEventListener("click", (e) => {
			e.stopPropagation();
			onToggle();
		});
	}

	pinnedIndicator.classList.toggle("vt-pinned", isPinned);
}

export function addCloseIndicator(
	leaf: WorkspaceLeaf,
	canClose: boolean,
	onClose: () => void
) {
	if (!leaf.containerEl) return;

	let closeIndicator = leaf.containerEl.querySelector(
		".vt-close-indicator"
	) as HTMLElement;

	if (!closeIndicator) {
		closeIndicator = leaf.containerEl.createDiv("vt-close-indicator");
		setIcon(closeIndicator, "x");
		closeIndicator.addEventListener("click", (e) => {
			e.stopPropagation();
			onClose();
		});
	}

	closeIndicator.classList.toggle("vt-can-close", canClose);
}
