import { App, ItemView, Keymap, UserEvent, WorkspaceLeaf } from "obsidian";

export function cloneNavButtons(leaf: WorkspaceLeaf, app: App) {
	// Get the original navigation buttons and their parent DOM element
	if (!(leaf.view instanceof ItemView)) return;
	const backButtonEl = leaf.view.backButtonEl;
	const forwardButtonEl = leaf.view.forwardButtonEl;
	if (!backButtonEl || !forwardButtonEl) return;
	const parent = backButtonEl.parentElement;
	if (!parent) return;

	// Check if already cloned - if so, return immediately
	const existingBackButton = parent.querySelector(".vt-back-button");
	const existingForwardButton = parent.querySelector(".vt-forward-button");
	if (existingBackButton || existingForwardButton) return;

	// Clone the buttons
	const clonedBackButton = backButtonEl.cloneNode(true) as HTMLButtonElement;
	const clonedForwardButton = forwardButtonEl.cloneNode(
		true
	) as HTMLButtonElement;
	clonedBackButton.classList.add("vt-back-button");
	clonedForwardButton.classList.add("vt-forward-button");
	parent.insertAfter(clonedBackButton, backButtonEl);
	parent.insertAfter(clonedForwardButton, forwardButtonEl);
	leaf.view.backButtonEl = clonedBackButton;
	leaf.view.forwardButtonEl = clonedForwardButton;

	// Hide original buttons
	backButtonEl.style.display = "none";
	forwardButtonEl.style.display = "none";

	// Add event listeners to cloned buttons
	const handleClick = (direction: "back" | "forward") => (e: UserEvent) => {
		e.preventDefault();
		e.stopPropagation();
		// Ignore middle mouse button clicks
		if (e instanceof MouseEvent && e.button === 2) return;
		// Without pressing the mod key, navigate inside the current leaf
		if (!Keymap.isModEvent(e)) {
			leaf.history.go(direction === "back" ? -1 : 1);
			return;
		}
		// If the mod key is pressed, open in a new leaf and update its history
		const currentState = leaf.getHistoryState();
		const recentState =
			direction === "back"
				? leaf.history.backHistory.last()
				: leaf.history.forwardHistory.first();
		if (!recentState) return;
		const targetLeaf = app.workspace.getLeaf("tab");
		targetLeaf.history.updateState(recentState);
		targetLeaf.history.backHistory =
			direction === "back"
				? leaf.history.backHistory.slice(0, -1)
				: [...leaf.history.backHistory, currentState];
		targetLeaf.history.forwardHistory =
			direction === "forward"
				? leaf.history.forwardHistory.slice(1)
				: [currentState, ...leaf.history.forwardHistory];
	};

	clonedBackButton.addEventListener("click", handleClick("back"));
	clonedForwardButton.addEventListener("click", handleClick("forward"));
}
