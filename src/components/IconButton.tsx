import { setIcon, setTooltip } from "obsidian";
import { useEffect, useRef } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";

interface IconButtonProps {
	icon: string;
	action: string;
	tooltip?: string;
	disabled?: boolean;
	isNavAction?: boolean;
	isActive?: boolean;
	onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const IconButton = (props: IconButtonProps) => {
	const buttonEl = useRef<HTMLDivElement>(null);
	const buttonElClasses: CssClasses = {
		"clickable-icon": true,
		"action-button": !props.isNavAction,
		"nav-action-button": props.isNavAction,
		[`action-${props.icon}`]: true,
		"is-active": props.isActive,
		"is-disabled": props.disabled,
	};

	useEffect(() => {
		if (buttonEl && buttonEl.current) {
			setIcon(buttonEl.current, props.icon);
			if (props.tooltip) setTooltip(buttonEl.current, props.tooltip);
		}
	}, [props.icon, props.tooltip]);

	return (
		<div
			className={toClassName(buttonElClasses)}
			data-action={props.action}
			ref={buttonEl}
			onClick={(e) => {
				e.stopPropagation();
				!props.disabled && props.onClick && props.onClick(e);
			}}
		/>
	);
};
