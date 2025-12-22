import { EventRef, WorkspaceLeaf } from "obsidian";
import { Identifier } from "src/models/VTWorkspace";

/**
 * Represents a target that can have events bound to it.
 * This can be a WorkspaceLeaf, WorkspaceParent, or any other Obsidian event emitter.
 */
export type EventTarget = {
	id: Identifier;
	on(name: string, callback: (...args: unknown[]) => void): EventRef;
	offref(ref: EventRef): void;
};

/**
 * Configuration for an event binder.
 * Defines how and where events should be bound.
 */
export interface EventBinderConfig<TCallback = (...args: unknown[]) => void> {
	/** Unique name for this event binder */
	name: string;
	/** Event name to bind */
	eventName: string;
	/** Function to get the target object from a leaf/group/etc */
	getTarget: (target: unknown) => EventTarget | null;
	/** Optional callback wrapper for additional logic */
	wrapCallback?: (callback: TCallback, target: EventTarget) => TCallback;
}

/**
 * Options for binding an event.
 */
export interface BindOptions {
	/**
	 * Scope for this binding. Default is "global".
	 * When once=true, only one binding per scope is allowed.
	 */
	scope?: string;
	/**
	 * If true, prevents duplicate bindings within the same scope.
	 * If false, allows multiple bindings. Default is true.
	 */
	once?: boolean;
}

/**
 * Internal record of a bound event.
 */
interface BoundEvent {
	binderName: string;
	targetId: Identifier;
	scope: string;
	eventRef: EventRef;
	target: EventTarget;
}

/**
 * Centralized singleton service for managing event bindings.
 *
 * Features:
 * - Register EventBinders that define how events should be bound
 * - Support scoped bindings to prevent duplicates
 * - Allow multiple bindings per target when once=false
 * - Centralized cleanup on plugin unload
 *
 * @example
 * ```ts
 * // Register binders
 * eventBindingService.registerBinder({
 *   name: "leaf-pinning",
 *   eventName: "pinned-change",
 *   getTarget: (leaf: WorkspaceLeaf) => leaf,
 * });
 *
 * // Bind event with scope
 * eventBindingService.bind(
 *   "leaf-pinning",
 *   leaf,
 *   (pinned: boolean) => console.log(pinned),
 *   { scope: "tab-component", once: true }
 * );
 *
 * // Unbind specific event
 * eventBindingService.unbind("leaf-pinning", leaf.id, "tab-component");
 *
 * // Unbind all events on unload
 * eventBindingService.unbindAll();
 * ```
 */
export class EventBindingService {
	private binders: Map<string, EventBinderConfig> = new Map();
	private boundEvents: BoundEvent[] = [];

	/**
	 * Register a new event binder configuration.
	 *
	 * @param config Configuration for the event binder
	 * @throws Error if a binder with the same name already exists
	 */
	registerBinder(config: EventBinderConfig): void {
		if (this.binders.has(config.name)) {
			throw new Error(
				`EventBinder with name "${config.name}" is already registered`
			);
		}
		this.binders.set(config.name, config);
	}

	/**
	 * Unregister an event binder.
	 * This will also unbind all events associated with this binder.
	 *
	 * @param binderName Name of the binder to unregister
	 */
	unregisterBinder(binderName: string): void {
		// Unbind all events for this binder
		const eventsToUnbind = this.boundEvents.filter(
			(event) => event.binderName === binderName
		);
		eventsToUnbind.forEach((event) => {
			event.target.offref(event.eventRef);
		});

		// Remove from bound events
		this.boundEvents = this.boundEvents.filter(
			(event) => event.binderName !== binderName
		);

		// Remove binder
		this.binders.delete(binderName);
	}

	/**
	 * Bind an event using a registered binder.
	 *
	 * @param binderName Name of the registered binder
	 * @param target Target object to bind the event to
	 * @param callback Callback function to execute when event fires
	 * @param options Binding options (scope, once)
	 * @returns True if binding was successful, false if prevented by scope check
	 * @throws Error if binder is not registered or target cannot be retrieved
	 */
	bind<TCallback extends (...args: any[]) => void>(
		binderName: string,
		target: any,
		callback: TCallback,
		options: BindOptions = {}
	): boolean {
		const { scope = "global", once = true } = options;

		// Get binder config
		const binder = this.binders.get(binderName);
		if (!binder) {
			throw new Error(`EventBinder "${binderName}" is not registered`);
		}

		// Get actual target
		const eventTarget = binder.getTarget(target);
		if (!eventTarget) {
			throw new Error(`Failed to get target for binder "${binderName}"`);
		}

		// Check if already bound with same scope
		if (once) {
			const existingBinding = this.boundEvents.find(
				(event) =>
					event.binderName === binderName &&
					event.targetId === eventTarget.id &&
					event.scope === scope
			);
			if (existingBinding) {
				return false; // Already bound, skip
			}
		}

		// Wrap callback if needed
		const finalCallback = binder.wrapCallback
			? binder.wrapCallback(callback, eventTarget)
			: callback;

		// Bind event
		const eventRef = eventTarget.on(binder.eventName, finalCallback);

		// Record binding
		this.boundEvents.push({
			binderName,
			targetId: eventTarget.id,
			scope,
			eventRef,
			target: eventTarget,
		});

		return true;
	}

	/**
	 * Unbind a specific event.
	 *
	 * @param binderName Name of the binder
	 * @param targetId ID of the target
	 * @param scope Scope of the binding (default: "global")
	 * @returns Number of events unbound
	 */
	unbind(binderName: string, targetId: Identifier, scope = "global"): number {
		const eventsToUnbind = this.boundEvents.filter(
			(event) =>
				event.binderName === binderName &&
				event.targetId === targetId &&
				event.scope === scope
		);

		eventsToUnbind.forEach((event) => {
			event.target.offref(event.eventRef);
		});

		this.boundEvents = this.boundEvents.filter(
			(event) =>
				!(
					event.binderName === binderName &&
					event.targetId === targetId &&
					event.scope === scope
				)
		);

		return eventsToUnbind.length;
	}

	/**
	 * Unbind all events for a specific target.
	 *
	 * @param targetId ID of the target
	 * @returns Number of events unbound
	 */
	unbindTarget(targetId: Identifier): number {
		const eventsToUnbind = this.boundEvents.filter(
			(event) => event.targetId === targetId
		);

		eventsToUnbind.forEach((event) => {
			event.target.offref(event.eventRef);
		});

		this.boundEvents = this.boundEvents.filter(
			(event) => event.targetId !== targetId
		);

		return eventsToUnbind.length;
	}

	/**
	 * Unbind all events for a specific binder.
	 *
	 * @param binderName Name of the binder
	 * @returns Number of events unbound
	 */
	unbindBinder(binderName: string): number {
		const eventsToUnbind = this.boundEvents.filter(
			(event) => event.binderName === binderName
		);

		eventsToUnbind.forEach((event) => {
			event.target.offref(event.eventRef);
		});

		this.boundEvents = this.boundEvents.filter(
			(event) => event.binderName !== binderName
		);

		return eventsToUnbind.length;
	}

	/**
	 * Unbind all events for a specific scope.
	 *
	 * @param scope Scope to unbind
	 * @returns Number of events unbound
	 */
	unbindScope(scope: string): number {
		const eventsToUnbind = this.boundEvents.filter(
			(event) => event.scope === scope
		);

		eventsToUnbind.forEach((event) => {
			event.target.offref(event.eventRef);
		});

		this.boundEvents = this.boundEvents.filter(
			(event) => event.scope !== scope
		);

		return eventsToUnbind.length;
	}

	/**
	 * Unbind all events managed by this service.
	 * This should be called on plugin unload.
	 *
	 * @returns Number of events unbound
	 */
	unbindAll(): number {
		const count = this.boundEvents.length;

		this.boundEvents.forEach((event) => {
			event.target.offref(event.eventRef);
		});

		this.boundEvents = [];

		return count;
	}

	/**
	 * Get all bound events for debugging or inspection.
	 *
	 * @returns Array of bound event information (without EventRef for safety)
	 */
	getDebugInfo(): Array<{
		binderName: string;
		targetId: Identifier;
		scope: string;
	}> {
		return this.boundEvents.map((event) => ({
			binderName: event.binderName,
			targetId: event.targetId,
			scope: event.scope,
		}));
	}

	/**
	 * Check if a specific binding exists.
	 *
	 * @param binderName Name of the binder
	 * @param targetId ID of the target
	 * @param scope Scope to check (default: "global")
	 * @returns True if binding exists
	 */
	hasBinding(
		binderName: string,
		targetId: Identifier,
		scope = "global"
	): boolean {
		return this.boundEvents.some(
			(event) =>
				event.binderName === binderName &&
				event.targetId === targetId &&
				event.scope === scope
		);
	}

	/**
	 * Get count of all bound events.
	 *
	 * @returns Total number of bound events
	 */
	getBindingCount(): number {
		return this.boundEvents.length;
	}

	/**
	 * Get count of bound events for a specific binder.
	 *
	 * @param binderName Name of the binder
	 * @returns Number of events for this binder
	 */
	getBinderCount(binderName: string): number {
		return this.boundEvents.filter(
			(event) => event.binderName === binderName
		).length;
	}
}

/**
 * Singleton instance of the EventBindingService.
 */
export const eventBindingService = new EventBindingService();

eventBindingService.registerBinder({
	name: "tab-pinning",
	eventName: "pinned-change",
	getTarget: (leaf: WorkspaceLeaf) => leaf,
});
