import {
	App,
	HistoryState,
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

	// General navigation function for both button clicks and menu items
	const handleNavigation = async (
		direction: "back" | "forward",
		steps: number,
		targetHistoryState: HistoryState | null = null,
		event?: MouseEvent | KeyboardEvent | UserEvent
	) => {
		const isModEvent = event ? Keymap.isModEvent(event) : false;

		// Without pressing the mod key, navigate in current leaf
		if (!isModEvent) {
			await leaf.history.go(steps);
			return;
		}

		// With pressing the mod key, open in new leaf and update its history
		const targetLeaf = app.workspace.getLeaf("tab");
		const currentState = leaf.getHistoryState();

		// Use provided history state or get the recent state
		const historyState =
			targetHistoryState ||
			(direction === "back"
				? leaf.history.backHistory.last()
				: leaf.history.forwardHistory.first());
		if (!historyState) return;

		// Set the target state
		await targetLeaf.history.updateState(historyState);

		// Update history arrays
		const backHistoryItems = leaf.history.backHistory;
		const forwardHistoryItems = leaf.history.forwardHistory;

		const backSplitIndex = targetHistoryState
			? backHistoryItems.indexOf(historyState)
			: backHistoryItems.length - 1;

		const forwardSplitIndex = targetHistoryState
			? forwardHistoryItems.indexOf(historyState)
			: 0;

		targetLeaf.history.backHistory =
			direction === "back"
				? backHistoryItems.slice(0, backSplitIndex)
				: [...backHistoryItems, currentState];

		targetLeaf.history.forwardHistory =
			direction === "forward"
				? forwardHistoryItems.slice(forwardSplitIndex + 1)
				: [currentState, ...forwardHistoryItems];

		// Request to update the nav buttons
		if (targetLeaf.view instanceof ItemView) {
			targetLeaf.view.updateNavButtons();
		}
	};

	// Button click handler
	const handleClick = (direction: "back" | "forward") => (e: UserEvent) => {
		e.preventDefault();
		e.stopPropagation();
		// Ignore middle mouse button clicks
		if (e instanceof MouseEvent && e.button === 2) return;

		const steps = direction === "back" ? -1 : 1;
		handleNavigation(direction, steps, null, e);
	};

	// Create history dropdown functionality
	const createMenu = (
		direction: "back" | "forward",
		isLongPress: boolean
	) => {
		const historyItems =
			direction === "back"
				? leaf.history.backHistory
				: leaf.history.forwardHistory;
		if (historyItems.length === 0) return;
		const menu = new Menu();

		// Add history items to menu
		historyItems.reverse().forEach((historyState, index) => {
			menu.addItem((item) => {
				return item
					.setTitle(historyState.title)
					.onClick(async (clickEvent) => {
						const steps =
							direction === "back" ? -(index + 1) : +(index + 1);
						await handleNavigation(
							direction,
							steps,
							historyState,
							clickEvent
						);
					});
			});
		});

		// Show menu at button position
		const target =
			direction === "back" ? clonedBackButton : clonedForwardButton;
		const rect = target.getBoundingClientRect();
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
		createMenu("back", false);
	});
	clonedForwardButton.addEventListener("contextmenu", (e) => {
		e.preventDefault();
		createMenu("forward", false);
	});

	// Add long press handlers for history dropdown
	addLongPressHandler(clonedBackButton, () => createMenu("back", true));
	addLongPressHandler(clonedForwardButton, () => createMenu("forward", true));
}
