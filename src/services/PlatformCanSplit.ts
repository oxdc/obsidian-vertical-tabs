import { Platform } from "obsidian";

let forceCanSplitDepth = 0;
let allowCanSplitUniversally = false;

export function runWithCanSplit<T>(fn: () => T): T {
	forceCanSplitDepth++;
	try {
		return fn();
	} finally {
		forceCanSplitDepth--;
	}
}

export function enableUniversalCanSplit(): void {
	allowCanSplitUniversally = true;
}

export function disableUniversalCanSplit(): void {
	allowCanSplitUniversally = false;
}

export function patchPlatformCanSplit(): () => void {
	const desc = Object.getOwnPropertyDescriptor(Platform, "canSplit");
	Object.defineProperty(Platform, "canSplit", {
		configurable: true,
		enumerable: desc?.enumerable ?? true,
		get: (): boolean => {
			if (forceCanSplitDepth > 0 || allowCanSplitUniversally) return true;
			const original: unknown = desc?.get?.call(Platform);
			return typeof original === "boolean" ? original : !Platform.isPhone;
		},
	});
	return () => {
		allowCanSplitUniversally = false;
		if (desc) Object.defineProperty(Platform, "canSplit", desc);
	};
}
