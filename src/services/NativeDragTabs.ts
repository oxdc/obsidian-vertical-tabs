import { App, WorkspaceLeaf, WorkspaceParent } from "obsidian";
import { GroupViewType, identifyGroupViewType } from "src/models/VTGroupView";

export interface DragState {
	isDragging: boolean;
	draggedLeaf: WorkspaceLeaf | null;
	draggedElement: HTMLElement | null;
	targetParent: WorkspaceParent | null;
	dropIndicator: HTMLElement | null;
}

export class NativeDragTabs {
	private app: App;
	private dragState: DragState;
	private boundHandlers: Map<string, EventListener> = new Map();

	constructor(app: App) {
		this.app = app;
		this.dragState = {
			isDragging: false,
			draggedLeaf: null,
			draggedElement: null,
			targetParent: null,
			dropIndicator: null,
		};
	}

	/**
	 * Initialize drag and drop functionality (Mission Control view only)
	 */
	public initialize(): void {
		this.app.workspace.iterateAllLeaves((leaf) => {
			this.makeLeafDraggable(leaf);
		});

		// Set up global event listeners
		const dragOverHandler = this.createBoundHandler(
			"dragover",
			this.handleDragOver.bind(this)
		);
		const dropHandler = this.createBoundHandler(
			"drop",
			this.handleDrop.bind(this)
		);

		document.addEventListener("dragover", dragOverHandler);
		document.addEventListener("drop", dropHandler);
	}

	/**
	 * Clean up all event listeners and drag state
	 */
	public cleanup(): void {
		// Remove global listeners
		this.boundHandlers.forEach((handler, event) => {
			document.removeEventListener(event, handler);
		});
		this.boundHandlers.clear();

		// Clean up drag state
		this.clearDragState();

		// Remove draggable attributes from all leaves
		this.app.workspace.iterateAllLeaves((leaf) => {
			if (leaf.containerEl) {
				leaf.containerEl.draggable = false;
				this.removeLeafHandlers(leaf);
			}
		});
	}

	/**
	 * Make a single leaf draggable (only in Mission Control view)
	 */
	public makeLeafDraggable(leaf: WorkspaceLeaf): void {
		if (!leaf.containerEl) return;

		// Only enable drag and drop in Mission Control view
		if (!this.isGridLayout(leaf.parent)) {
			leaf.containerEl.draggable = false;
			leaf.containerEl.style.cursor = "";
			this.removeLeafHandlers(leaf);
			return;
		}

		leaf.containerEl.draggable = true;
		leaf.containerEl.style.cursor = "grab";

		// Remove existing handlers to prevent duplicates
		this.removeLeafHandlers(leaf);

		const dragStartHandler = this.handleDragStart.bind(this, leaf);
		const dragEndHandler = this.handleDragEnd.bind(this, leaf);

		leaf.containerEl.addEventListener("dragstart", dragStartHandler);
		leaf.containerEl.addEventListener("dragend", dragEndHandler);

		// Store handlers for cleanup
		(
			leaf.containerEl as HTMLElement & {
				__dragHandlers?: Record<string, EventListener>;
			}
		).__dragHandlers = {
			dragstart: dragStartHandler,
			dragend: dragEndHandler,
		};
	}

	/**
	 * Remove drag handlers from a leaf
	 */
	private removeLeafHandlers(leaf: WorkspaceLeaf): void {
		if (!leaf.containerEl) return;

		const handlers = (
			leaf.containerEl as HTMLElement & {
				__dragHandlers?: Record<string, EventListener>;
			}
		).__dragHandlers;
		if (handlers) {
			leaf.containerEl.removeEventListener(
				"dragstart",
				handlers.dragstart
			);
			leaf.containerEl.removeEventListener("dragend", handlers.dragend);
			delete (
				leaf.containerEl as HTMLElement & {
					__dragHandlers?: Record<string, EventListener>;
				}
			).__dragHandlers;
		}
	}

	/**
	 * Handle drag start event
	 */
	private handleDragStart(leaf: WorkspaceLeaf, event: DragEvent): void {
		if (!leaf.containerEl) return;

		this.dragState.isDragging = true;
		this.dragState.draggedLeaf = leaf;
		this.dragState.draggedElement = leaf.containerEl;
		this.dragState.targetParent = leaf.parent;

		// Set drag effect
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", leaf.id);
		}

		// Add dragging class for visual feedback
		leaf.containerEl.classList.add("vt-dragging");
		leaf.containerEl.style.cursor = "grabbing";

		// Add class to parent container
		if (leaf.parent.tabsContainerEl) {
			leaf.parent.tabsContainerEl.classList.add("vt-drag-active");
		}

		console.log("Drag started for leaf:", leaf.id);
	}

	/**
	 * Handle drag over event for drop zones (Mission Control view only)
	 */
	private handleDragOver(event: DragEvent): void {
		if (!this.dragState.isDragging || !this.dragState.draggedLeaf) return;

		event.preventDefault();

		const target = event.target as Element;
		const tabContainer = target.closest(".workspace-tab-container");

		if (!tabContainer) {
			this.hideDropIndicator();
			return;
		}

		// Find the parent that contains this tab container
		const parent = this.findParentFromTabContainer(
			tabContainer as HTMLElement
		);
		if (!parent || parent !== this.dragState.targetParent) {
			this.hideDropIndicator();
			return;
		}

		// Only allow dropping within the same parent and only in Mission Control view
		if (
			parent.id !== this.dragState.draggedLeaf.parent.id ||
			!this.isGridLayout(parent)
		) {
			this.hideDropIndicator();
			return;
		}

		// Find the closest leaf element to determine drop position
		const closestLeaf = this.findClosestLeaf(
			parent,
			event.clientY,
			event.clientX
		);
		this.showDropIndicator(
			parent,
			closestLeaf,
			event.clientY,
			event.clientX
		);

		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = "move";
		}
	}

	/**
	 * Handle drop event (Mission Control view only)
	 */
	private handleDrop(event: DragEvent): void {
		event.preventDefault();

		if (!this.dragState.isDragging || !this.dragState.draggedLeaf) {
			this.clearDragState();
			return;
		}

		const target = event.target as Element;
		const tabContainer = target.closest(".workspace-tab-container");

		if (!tabContainer) {
			this.clearDragState();
			return;
		}

		const parent = this.findParentFromTabContainer(
			tabContainer as HTMLElement
		);
		if (
			!parent ||
			parent.id !== this.dragState.draggedLeaf.parent.id ||
			!this.isGridLayout(parent)
		) {
			this.clearDragState();
			return;
		}

		// Determine drop position
		const closestLeaf = this.findClosestLeaf(
			parent,
			event.clientY,
			event.clientX
		);
		const dropIndex = this.calculateDropIndex(
			parent,
			closestLeaf,
			event.clientY,
			event.clientX
		);

		// Perform the move
		this.moveLeafToPosition(this.dragState.draggedLeaf, parent, dropIndex);

		console.log(
			`Dropped leaf ${this.dragState.draggedLeaf.id} at index ${dropIndex}`
		);

		this.clearDragState();
	}

	/**
	 * Handle drag end event
	 */
	private handleDragEnd(leaf: WorkspaceLeaf, event: DragEvent): void {
		console.log("Drag ended for leaf:", leaf.id);
		this.clearDragState();
	}

	/**
	 * Check if a parent is using grid layout (Mission Control view)
	 */
	private isGridLayout(parent: WorkspaceParent): boolean {
		return (
			identifyGroupViewType(parent) === GroupViewType.MissionControlView
		);
	}

	/**
	 * Find the parent workspace from a tab container element
	 */
	private findParentFromTabContainer(
		tabContainer: HTMLElement
	): WorkspaceParent | null {
		// Find parent by iterating through all leaves and checking their parents
		let foundParent: WorkspaceParent | null = null;

		this.app.workspace.iterateAllLeaves((leaf) => {
			if (
				leaf.parent &&
				leaf.parent.tabsContainerEl &&
				(leaf.parent.tabsContainerEl.contains(tabContainer) ||
					leaf.parent.tabsContainerEl === tabContainer)
			) {
				foundParent = leaf.parent;
			}
		});

		return foundParent;
	}

	/**
	 * Find the closest leaf element to coordinates (Mission Control view only)
	 */
	private findClosestLeaf(
		parent: WorkspaceParent,
		clientY: number,
		clientX?: number
	): WorkspaceLeaf | null {
		let closestLeaf: WorkspaceLeaf | null = null;
		let closestDistance = Infinity;

		parent.children.forEach((leaf) => {
			if (!leaf.containerEl || leaf === this.dragState.draggedLeaf)
				return;

			const rect = leaf.containerEl.getBoundingClientRect();

			// For Mission Control grid layout, use 2D distance for better leaf selection
			// but we'll only position indicators vertically (above/below)
			if (clientX !== undefined) {
				const centerX = rect.left + rect.width / 2;
				const centerY = rect.top + rect.height / 2;
				const deltaX = centerX - clientX;
				const deltaY = centerY - clientY;
				const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestLeaf = leaf;
				}
			} else {
				// Fallback to Y distance only
				const distance = Math.abs(rect.top + rect.height / 2 - clientY);
				if (distance < closestDistance) {
					closestDistance = distance;
					closestLeaf = leaf;
				}
			}
		});

		return closestLeaf;
	}

	/**
	 * Calculate the drop index based on horizontal position (Mission Control view only)
	 */
	private calculateDropIndex(
		parent: WorkspaceParent,
		closestLeaf: WorkspaceLeaf | null,
		clientY: number,
		clientX?: number
	): number {
		if (!closestLeaf) {
			return parent.children.length;
		}

		const leafIndex = parent.children.indexOf(closestLeaf);
		if (leafIndex === -1) return parent.children.length;

		const rect = closestLeaf.containerEl?.getBoundingClientRect();
		if (!rect) return leafIndex;

		// For Mission Control grid layout, use horizontal positioning (left/right)
		if (clientX !== undefined) {
			const leafCenterX = rect.left + rect.width / 2;
			return clientX < leafCenterX ? leafIndex : leafIndex + 1;
		}

		// Fallback to before if no X coordinate
		return leafIndex;
	}

	/**
	 * Move a leaf to a specific position within its parent
	 */
	private moveLeafToPosition(
		leaf: WorkspaceLeaf,
		parent: WorkspaceParent,
		index: number
	): void {
		const currentIndex = parent.children.indexOf(leaf);
		if (currentIndex === -1 || currentIndex === index) return;

		// Adjust index if moving within same parent
		const targetIndex = currentIndex < index ? index - 1 : index;

		// Remove from current position
		parent.removeChild(leaf);
		leaf.setDimension(null);

		// Insert at new position
		parent.insertChild(targetIndex, leaf);
		parent.selectTab(leaf);
		parent.recomputeChildrenDimensions();

		// Update DOM order
		this.updateDOMOrder(parent);

		// Request workspace resize
		this.app.workspace.requestResize();
	}

	/**
	 * Update DOM order to match the children order
	 */
	private updateDOMOrder(parent: WorkspaceParent): void {
		if (!parent.tabsContainerEl) return;

		parent.children.forEach((leaf) => {
			if (leaf.containerEl && parent.tabsContainerEl) {
				parent.tabsContainerEl.appendChild(leaf.containerEl);
			}
		});
	}

	/**
	 * Show vertical drop indicator (Mission Control view only)
	 */
	private showDropIndicator(
		parent: WorkspaceParent,
		closestLeaf: WorkspaceLeaf | null,
		clientY: number,
		clientX?: number
	): void {
		if (!parent.tabsContainerEl) return;

		// Create drop indicator if it doesn't exist
		if (!this.dragState.dropIndicator) {
			this.dragState.dropIndicator = document.createElement("div");
			this.dragState.dropIndicator.classList.add("vt-drop-indicator");
			this.dragState.dropIndicator.style.cssText = `
				position: absolute;
				top: 0;
				bottom: 0;
				width: 3px;
				background-color: var(--interactive-accent);
				border-radius: 1px;
				z-index: 1000;
				pointer-events: none;
			`;
		}

		if (closestLeaf && closestLeaf.containerEl && clientX !== undefined) {
			const rect = closestLeaf.containerEl.getBoundingClientRect();
			const containerRect =
				parent.tabsContainerEl.getBoundingClientRect();

			// Get scroll offsets to account for scrollable containers
			const containerScrollLeft = parent.tabsContainerEl.scrollLeft || 0;
			const containerScrollTop = parent.tabsContainerEl.scrollTop || 0;

			// Show vertical indicator (left/right) for Mission Control grid
			// Position both indicators in center of gap (20px gap / 2 = 10px offset)
			const leafCenterX = rect.left + rect.width / 2;
			const gapOffset = 10; // Half of the 20px gap between tabs

			if (clientX < leafCenterX) {
				// Left of the leaf - show indicator in center of left gap
				this.dragState.dropIndicator.style.left = `${
					rect.left -
					containerRect.left -
					gapOffset +
					containerScrollLeft
				}px`;
			} else {
				// Right of the leaf - show indicator in center of right gap
				this.dragState.dropIndicator.style.left = `${
					rect.right -
					containerRect.left +
					gapOffset +
					containerScrollLeft
				}px`;
			}

			// Span the height of the leaf for better visibility
			this.dragState.dropIndicator.style.top = `${
				rect.top - containerRect.top + containerScrollTop
			}px`;
			this.dragState.dropIndicator.style.width = "3px";
			this.dragState.dropIndicator.style.height = `${rect.height}px`;
		} else {
			// Drop at the end - position at right edge of container
			this.dragState.dropIndicator.style.left = "calc(100% - 3px)";
			this.dragState.dropIndicator.style.top = "0";
			this.dragState.dropIndicator.style.width = "3px";
			this.dragState.dropIndicator.style.height = "100%";
		}

		// Add to container if not already added
		if (!this.dragState.dropIndicator.parentElement) {
			parent.tabsContainerEl.style.position = "relative";
			parent.tabsContainerEl.appendChild(this.dragState.dropIndicator);
		}
	}

	/**
	 * Hide the drop indicator
	 */
	private hideDropIndicator(): void {
		if (
			this.dragState.dropIndicator &&
			this.dragState.dropIndicator.parentElement
		) {
			this.dragState.dropIndicator.parentElement.removeChild(
				this.dragState.dropIndicator
			);
		}
	}

	/**
	 * Clear all drag state and visual indicators
	 */
	private clearDragState(): void {
		// Remove visual feedback
		if (this.dragState.draggedElement) {
			this.dragState.draggedElement.classList.remove("vt-dragging");
			this.dragState.draggedElement.style.cursor = "grab";
		}

		if (this.dragState.targetParent?.tabsContainerEl) {
			this.dragState.targetParent.tabsContainerEl.classList.remove(
				"vt-drag-active"
			);
		}

		// Hide drop indicator
		this.hideDropIndicator();

		// Clear state
		this.dragState = {
			isDragging: false,
			draggedLeaf: null,
			draggedElement: null,
			targetParent: null,
			dropIndicator: null,
		};
	}

	/**
	 * Create a bound event handler and store it for cleanup
	 */
	private createBoundHandler(
		eventName: string,
		handler: EventListener
	): EventListener {
		this.boundHandlers.set(eventName, handler);
		return handler;
	}

	/**
	 * Refresh draggable state for a specific leaf (useful when leaves are added/removed)
	 */
	public refreshLeaf(leaf: WorkspaceLeaf): void {
		this.makeLeafDraggable(leaf);
	}

	/**
	 * Get current drag state (useful for debugging)
	 */
	public getDragState(): DragState {
		return { ...this.dragState };
	}
}
