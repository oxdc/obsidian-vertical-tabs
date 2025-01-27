import { useState } from "react";

export enum SwipeDirection {
	Up = "up",
	Down = "down",
	Left = "left",
	Right = "right",
	None = "none",
}

interface TouchSensorOptions {
	minDistance: number;
	callback: (
		moved: boolean,
		direction: SwipeDirection,
		event: TouchEvent
	) => void;
}

export const useTouchSensor = (options: TouchSensorOptions) => {
	const { minDistance, callback } = options;

	const [startX, setStartX] = useState(0);
	const [startY, setStartY] = useState(0);
	const [moved, setMoved] = useState(false);
	const [direction, setDirection] = useState(SwipeDirection.None);

	const onTouchStart = (event: React.TouchEvent) => {
		setStartX(event.touches[0].clientX);
		setStartY(event.touches[0].clientY);
		setMoved(false);
		setDirection(SwipeDirection.None);
	};

	const onTouchMove = (event: React.TouchEvent) => {
		const dx = event.touches[0].clientX - startX;
		const dy = event.touches[0].clientY - startY;
		if (Math.sqrt(dx * dx + dy * dy) > minDistance) {
			setMoved(true);
		}
		if (Math.abs(dx) < minDistance && Math.abs(dy) > minDistance) {
			setDirection(dy > 0 ? SwipeDirection.Down : SwipeDirection.Up);
		} else if (Math.abs(dy) < minDistance && Math.abs(dx) > minDistance) {
			setDirection(dx > 0 ? SwipeDirection.Right : SwipeDirection.Left);
		} else {
			setDirection(SwipeDirection.None);
		}
	};

	const onTouchEnd = (event: React.TouchEvent) => {
		callback(moved, direction, event.nativeEvent);
	};

	const listeners = {
		onTouchStart,
		onTouchMove,
		onTouchEnd,
	};

	return { listeners };
};
