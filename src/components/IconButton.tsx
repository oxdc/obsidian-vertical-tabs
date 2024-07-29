import { setIcon, setTooltip } from "obsidian";
import { useEffect, useRef } from "react";

interface IconButtonProps {
	icon: string;
	action: string;
	tooltip: string;
	disabled?: boolean;
	onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const IconButton = (props: IconButtonProps) => {
	const buttonEl = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (buttonEl && buttonEl.current) {
			setIcon(buttonEl.current, props.icon);
			setTooltip(buttonEl.current, props.tooltip);
		}
	}, []);

	return (
		<div
			className={`clickable-icon action-button action-${props.icon}`}
			ref={buttonEl}
			onClick={(e) =>
				!props.disabled && props.onClick && props.onClick(e)
			}
		/>
	);
};
