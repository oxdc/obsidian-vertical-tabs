import { App } from "obsidian";
import { NativeDragTabs } from "./NativeDragTabs";
import { useViewState } from "src/models/ViewState";
import { autoRefresh } from "./Refresh";
import { REFRESH_TIMEOUT_LONG } from "src/constants/Timeouts";
import { ALT_KEY_EFFECT_DURATION } from "src/models/ViewState";
import ObsidianVerticalTabs from "src/main";

export class DragDetectionService {
	private app: App;
	private plugin: ObsidianVerticalTabs;
	private nativeDragTabs: NativeDragTabs | null = null;
	private dragInProgress = false;
	private draggedLeaf: Element | null = null;
	private altKeyTimeoutRef: NodeJS.Timeout | null = null;

	constructor(app: App, plugin: ObsidianVerticalTabs) {
		this.app = app;
		this.plugin = plugin;
	}

	private isLeafDragTarget(target: Element): boolean {
		return (
			target.closest(".workspace-tab-header") !== null ||
			target.closest(".workspace-tab") !== null ||
			target.closest(".vt-tab-handle") !== null ||
			target.classList.contains("workspace-tab-header") ||
			target.classList.contains("workspace-tab") ||
			target.classList.contains("vt-tab-handle")
		);
	}

	private handleDragStart = (e: DragEvent) => {
		const target = e.target as Element;
		if (target && this.isLeafDragTarget(target)) {
			this.dragInProgress = true;
			this.draggedLeaf = target;
		}
	};

	private handleDragEnd = (e: DragEvent) => {
		if (this.dragInProgress) {
			setTimeout(() => {
				this.dragInProgress = false;
				this.draggedLeaf = null;
			}, 0);
		}
	};

	private handleDrop = () => {
		setTimeout(() => autoRefresh(this.plugin), REFRESH_TIMEOUT_LONG);
	};

	private handleKeyDown = (event: KeyboardEvent) => {
		if (event.altKey) {
			useViewState.getState().setAltKeyState(true);
			if (this.altKeyTimeoutRef) {
				clearTimeout(this.altKeyTimeoutRef);
			}
			this.altKeyTimeoutRef = setTimeout(
				() => useViewState.getState().setAltKeyState(false),
				ALT_KEY_EFFECT_DURATION
			);
		}
	};

	public initialize(): void {
		// Initialize native drag and drop for tab rearrangement
		this.nativeDragTabs = new NativeDragTabs(this.app);
		useViewState.getState().setNativeDragTabs(this.nativeDragTabs);
		this.nativeDragTabs.initialize();

		// Register layout-change event to refresh drag functionality
		this.plugin.registerEvent(
			this.app.workspace.on("layout-change", () => {
				if (this.nativeDragTabs) {
					this.app.workspace.iterateAllLeaves((leaf) => {
						this.nativeDragTabs?.refreshLeaf(leaf);
					});
				}
			})
		);

		// Register global DOM event listeners
		this.plugin.registerDomEvent(window, "keydown", this.handleKeyDown);
		this.plugin.registerDomEvent(window, "dragstart", this.handleDragStart);
		this.plugin.registerDomEvent(window, "dragend", this.handleDragEnd);
		this.plugin.registerDomEvent(window, "drop", this.handleDrop);
	}

	public cleanup(): void {
		if (this.altKeyTimeoutRef) {
			clearTimeout(this.altKeyTimeoutRef);
			this.altKeyTimeoutRef = null;
		}
		if (this.nativeDragTabs) {
			this.nativeDragTabs.cleanup();
			this.nativeDragTabs = null;
		}
	}
}
