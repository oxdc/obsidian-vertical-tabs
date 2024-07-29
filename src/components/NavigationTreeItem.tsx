import { setIcon } from "obsidian";
import { useEffect, useRef } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";

interface NavigationTreeItemProps {
	title: string;
	icon: string;
	isTab: boolean;
	isActive?: boolean;
	isPinned?: boolean;
	isCollapsed?: boolean;
	children?: React.ReactNode;
	toolbar?: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export const NavigationTreeItem = (props: NavigationTreeItemProps) => {
	const iconEl = useRef<HTMLDivElement>(null);

	const itemElClasses: CssClasses = {
		"tree-item": true,
		"is-tab": props.isTab,
		"is-group": !props.isTab,
		"is-pinned": props.isPinned,
		"is-collapsed": props.isCollapsed,
	};
	const selfElClasses: CssClasses = {
		"tree-item-self": true,
		"is-clickable": true,
		"is-active": props.isActive,
	};

	useEffect(() => {
		if (iconEl && iconEl.current) setIcon(iconEl.current, props.icon);
	}, [props.icon]);

	return (
		<div className={toClassName(itemElClasses)}>
			<div className={toClassName(selfElClasses)} onClick={props.onClick}>
				<div className="tree-item-icon" ref={iconEl}></div>
				<div className="tree-item-inner">
					<div className="tree-item-inner-text">{props.title}</div>
				</div>
				<div className="tree-item-flair-outer">{props.toolbar}</div>
			</div>
			{!props.isCollapsed && (
				<div className="tree-item-children">{props.children}</div>
			)}
		</div>
	);
};
