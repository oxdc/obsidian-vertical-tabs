import { useState } from "react";

interface TouchSensorOptions {
	minDistance: number;
	callback: (moved: boolean) => void;
}

export const useTouchSensor = (options: TouchSensorOptions) => {
	const { minDistance, callback } = options;

	const [startX, setStartX] = useState(0);
	const [startY, setStartY] = useState(0);
	const [moved, setMoved] = useState(false);

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
	};

	const onTouchEnd = () => {
		callback(moved);
	};

	const listeners = {
		onTouchStart,
		onTouchMove,
		onTouchEnd,
	};

	return { listeners };
};
