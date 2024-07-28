import { setIcon } from "obsidian";
import { useEffect, useRef } from "react";

interface NavigationTabItemProps {
	title: string;
	icon: string;
	children?: React.ReactNode;
}

export const NavigationTabItem = (props: NavigationTabItemProps) => {
	const iconEl = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (iconEl && iconEl.current) setIcon(iconEl.current, props.icon);
	}, [props.icon]);

	return (
		<div className="tree-item">
			<div className="tree-item-self">
				<div className="tree-item-icon" ref={iconEl}></div>
				<div className="tree-item-inner">
					<div className="tree-item-inner-text">{props.title}</div>
				</div>
				<div className="tree-item-flair-outer tab-toolbar"></div>
			</div>
			<div className="tree-item-children">{props.children}</div>
		</div>
	);
};
