import { setIcon } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";

interface NavigationTreeItemProps {
	title: string;
	icon: string;
	isTab: boolean;
	isActive?: boolean;
	isPinned?: boolean;
	isCollapsed?: boolean;
	isSidebar?: boolean;
	children?: React.ReactNode;
	toolbar?: React.ReactNode;
	onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	dataType?: string;
	dataId?: string;
}

export const NavigationTreeItem = (props: NavigationTreeItemProps) => {
	const iconEl = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);

	const itemElClasses: CssClasses = {
		"tree-item": true,
		"is-tab": props.isTab,
		"is-group": !props.isTab,
		"is-pinned": props.isPinned,
		"is-collapsed": props.isCollapsed,
		"is-sidebar": props.isSidebar,
	};
	const selfElClasses: CssClasses = {
		"tree-item-self": true,
		"is-clickable": true,
		"is-active": props.isActive,
	};

	useEffect(() => {
		if (iconEl && iconEl.current) setIcon(iconEl.current, props.icon);
	}, [props.icon]);

	useEffect(() => {
		if (props.children && props.children instanceof Array) {
			setHeight((props.children as Array<HTMLElement>).length * 20);
		}
	}, [props.isCollapsed]);

	return (
		<div
			className={toClassName(itemElClasses)}
			style={{ minHeight: props.isCollapsed ? 0 : height }}
			data-type={props.dataType}
			data-id={props.dataId}
		>
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
