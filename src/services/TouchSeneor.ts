import { useState } from "react";

enum SweepDirection {
	Up = "up",
	Down = "down",
	Left = "left",
	Right = "right",
	None = "none",
}

interface TouchSensorOptions {
	minDistance: number;
	callback: (moved: boolean, sweepDirection: SweepDirection) => void;
}

export const useTouchSensor = (options: TouchSensorOptions) => {
	const { minDistance, callback } = options;

	const [startX, setStartX] = useState(0);
	const [startY, setStartY] = useState(0);
	const [moved, setMoved] = useState(false);
	const [sweepDirection, setDirection] = useState(SweepDirection.None);

	const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
		setStartX(event.touches[0].clientX);
		setStartY(event.touches[0].clientY);
		setMoved(false);
	};

	const onTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
		const dx = event.touches[0].clientX - startX;
		const dy = event.touches[0].clientY - startY;
		if (Math.sqrt(dx * dx + dy * dy) > minDistance) {
			setMoved(true);
		}
		if (Math.abs(dx) < minDistance && Math.abs(dy) > minDistance) {
			setDirection(dy > 0 ? SweepDirection.Down : SweepDirection.Up);
		} else if (Math.abs(dy) < minDistance && Math.abs(dx) > minDistance) {
			setDirection(dx > 0 ? SweepDirection.Right : SweepDirection.Left);
		} else {
			setDirection(SweepDirection.None);
		}
	};

	const onTouchEnd = () => {
		callback(moved, sweepDirection);
	};

	const listeners = {
		onTouchStart,
		onTouchMove,
		onTouchEnd,
	};

	return { listeners };
};
