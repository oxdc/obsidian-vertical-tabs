import { type TouchEvent as ReactTouchEvent, useRef } from "react";

export enum SwipeDirection {
	Up = "up",
	Down = "down",
	Left = "left",
	Right = "right",
	None = "none",
}

interface TouchSensorOptions {
	minDistance: number;
	callback: (moved: boolean, direction: SwipeDirection, event: TouchEvent) => void;
}

interface TouchState {
	startX: number;
	startY: number;
	moved: boolean;
	direction: SwipeDirection;
}

export const useTouchSensor = (options: TouchSensorOptions) => {
	const { minDistance, callback } = options;

	const touchRef = useRef<TouchState>({
		startX: 0,
		startY: 0,
		moved: false,
		direction: SwipeDirection.None,
	});

	const onTouchStart = (event: ReactTouchEvent) => {
		if (!event.touches[0]) return;
		touchRef.current = {
			startX: event.touches[0].clientX,
			startY: event.touches[0].clientY,
			moved: false,
			direction: SwipeDirection.None,
		};
	};

	const onTouchMove = (event: ReactTouchEvent) => {
		if (!event.touches[0]) return;
		const touch = touchRef.current;
		const dx = event.touches[0].clientX - touch.startX;
		const dy = event.touches[0].clientY - touch.startY;
		if (Math.sqrt(dx * dx + dy * dy) > minDistance) {
			touch.moved = true;
		}
		if (Math.abs(dx) < minDistance && Math.abs(dy) > minDistance) {
			touch.direction = dy > 0 ? SwipeDirection.Down : SwipeDirection.Up;
		} else if (Math.abs(dy) < minDistance && Math.abs(dx) > minDistance) {
			touch.direction = dx > 0 ? SwipeDirection.Right : SwipeDirection.Left;
		} else {
			touch.direction = SwipeDirection.None;
		}
	};

	const onTouchEnd = (event: ReactTouchEvent) => {
		const { moved, direction } = touchRef.current;
		// Suppress the ghost click that browsers fire after a touch that
		// scrolled/dragged, so a scroll gesture never also triggers a tap action.
		if (moved && event.cancelable) event.preventDefault();
		callback(moved, direction, event.nativeEvent);
	};

	const listeners = {
		onTouchStart,
		onTouchMove,
		onTouchEnd,
	};

	return { listeners };
};
