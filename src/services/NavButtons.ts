import {
	App,
	ItemView,
	Keymap,
	Menu,
	UserEvent,
	WorkspaceLeaf,
} from "obsidian";

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

	// Create history dropdown functionality
	const createHistoryMenu =
		(direction: "back" | "forward") => (isLongPress: boolean) => {
			const historyItems =
				direction === "back"
					? leaf.history.backHistory
					: leaf.history.forwardHistory;
			if (historyItems.length === 0) return;
			const menu = new Menu();

			// Add history items to menu (in reverse order for back, normal order for forward)
			const items =
				direction === "back"
					? [...historyItems].reverse()
					: historyItems;

			items.forEach((historyState, index) => {
				menu.addItem((item) => {
					return item
						.setTitle(historyState.title)
						.onClick(async (clickEvent) => {
							const isModEvent = Keymap.isModEvent(clickEvent);

							if (!isModEvent) {
								// Navigate in current leaf
								const steps =
									direction === "back"
										? -(historyItems.length - index)
										: index + 1;
								await leaf.history.go(steps);
							} else {
								// Open in new leaf with proper history state
								const targetLeaf = app.workspace.getLeaf("tab");
								const currentState = leaf.getHistoryState();

								// Set the target state
								await targetLeaf.history.updateState(
									historyState
								);

								// Update history arrays
								if (direction === "back") {
									targetLeaf.history.backHistory =
										historyItems.slice(
											0,
											historyItems.length - index - 1
										);
									targetLeaf.history.forwardHistory = [
										currentState,
										...leaf.history.forwardHistory,
									];
								} else {
									targetLeaf.history.backHistory = [
										...leaf.history.backHistory,
										currentState,
									];
									targetLeaf.history.forwardHistory =
										historyItems.slice(index + 1);
								}
							}
						});
				});
			});

			// Show menu at button position
			const buttonEl =
				direction === "back" ? clonedBackButton : clonedForwardButton;
			const rect = buttonEl.getBoundingClientRect();
			menu.showAtPosition({
				x: rect.x,
				y: rect.bottom,
				width: rect.width,
				overlap: true,
			});

			// Handle mouseup events for long press
			if (isLongPress) {
				menu.dom.addEventListener("mouseup", (event) => {
					const targetNode = event.target as Node;
					setTimeout(() => {
						for (const menuItem of menu.items) {
							if (menuItem.dom.contains(targetNode)) {
								menuItem.handleEvent?.(event);
								return;
							}
						}
					});
				});
			}
		};

	// Helper function for long press detection
	const addLongPressHandler = (
		element: HTMLElement,
		onLongPress: () => void
	) => {
		element.addEventListener("mousedown", (mouseDownEvent) => {
			const longPressTimer = window.setTimeout(() => {
				cleanup();
				onLongPress();
			}, 400);

			const cleanup = () => {
				window.removeEventListener("mouseup", onMouseUp);
				window.removeEventListener("mousemove", onMouseMove);
				window.clearTimeout(longPressTimer);
			};

			const onMouseUp = () => {
				cleanup();
			};

			const onMouseMove = (mouseMoveEvent: MouseEvent) => {
				const deltaX = mouseMoveEvent.clientX - mouseDownEvent.clientX;
				const deltaY = mouseMoveEvent.clientY - mouseDownEvent.clientY;
				const distance = deltaX * deltaX + deltaY * deltaY;

				// If mouse moved more than 5px, cancel long press
				if (distance > 25) {
					cleanup();
					// If dragged downward, trigger long press
					if (deltaY > 0 && deltaY > Math.abs(deltaX)) {
						onLongPress();
					}
				}
			};

			window.addEventListener("mouseup", onMouseUp);
			window.addEventListener("mousemove", onMouseMove);
		});
	};

	// Add event listeners to cloned buttons
	clonedBackButton.addEventListener("click", handleClick("back"));
	clonedForwardButton.addEventListener("click", handleClick("forward"));

	// Add context menu (right-click) for history dropdown
	clonedBackButton.addEventListener("contextmenu", (e) => {
		e.preventDefault();
		createHistoryMenu("back")(false);
	});
	clonedForwardButton.addEventListener("contextmenu", (e) => {
		e.preventDefault();
		createHistoryMenu("forward")(false);
	});

	// Add long press handlers for history dropdown
	addLongPressHandler(clonedBackButton, () =>
		createHistoryMenu("back")(true)
	);
	addLongPressHandler(clonedForwardButton, () =>
		createHistoryMenu("forward")(true)
	);
}
