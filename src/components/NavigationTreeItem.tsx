import { Platform, setIcon } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";
import { useSortable } from "@dnd-kit/sortable";
import { IconButton } from "./IconButton";
import { Identifier } from "src/models/VTWorkspace";

interface NavigationTreeItemProps {
	id: Identifier | null;
	ref?: React.RefObject<HTMLDivElement | null>;
	title: string | React.ReactNode;
	icon: string;
	isTab: boolean;
	isEphemeralTab?: boolean;
	isTabSlot?: boolean;
	isGroupSlot?: boolean;
	isSingleGroup?: boolean;
	isActive?: boolean;
	isRenaming?: boolean;
	isPinned?: boolean;
	isCollapsed?: boolean;
	isSidebar?: boolean;
	isHighlighted?: boolean;
	children?: React.ReactNode;
	toolbar?: React.ReactNode;
	onClick?: (event?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	onTouchStart?: (event: React.TouchEvent<HTMLDivElement>) => void;
	onTouchMove?: (event: React.TouchEvent<HTMLDivElement>) => void;
	onTouchEnd?: (event: React.TouchEvent<HTMLDivElement>) => void;
	onAuxClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	onDoubleClick?: (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => void;
	onContextMenu?: (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>
	) => void;
	dataType?: string;
	dataId?: string;
}

export const NavigationTreeItem = (props: NavigationTreeItemProps) => {
	const { attributes, listeners, setNodeRef, isDragging, isOver } =
		useSortable({
			id: props.id ?? "",
			data: { isTab: props.isTab && !props.isTabSlot },
			disabled: !props.id || props.isTabSlot || props.isGroupSlot,
		});

	const iconEl = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);

	const itemElClasses: CssClasses = {
		"tree-item": true,
		"is-tab": props.isTab,
		"is-ephemeral-tab": props.isTab && props.isEphemeralTab,
		"is-group": !props.isTab,
		"nav-folder": !props.isTab,
		"is-pinned": props.isPinned,
		"is-collapsed": props.isCollapsed,
		"is-sidebar": props.isSidebar,
		"is-being-dragged": isDragging,
		"vt-is-being-dragged-over": isOver,
		"is-tab-slot": props.isTabSlot,
		"is-group-slot": props.isGroupSlot,
		"is-single-group": props.isSingleGroup,
		"is-slot": props.isTabSlot || props.isGroupSlot,
		"is-highlighted": props.isHighlighted,
	};
	const selfElClasses: CssClasses = {
		"tree-item-self": true,
		"is-clickable": true,
		"is-active": props.isActive,
		"is-being-dragged": isDragging,
		"is-being-renamed": props.isRenaming,
	};

	useEffect(() => {
		if (iconEl && iconEl.current) setIcon(iconEl.current, props.icon);
	}, [props.icon]);

	useEffect(() => {
		if (props.children && props.children instanceof Array) {
			setHeight((props.children as Array<HTMLElement>).length * 20);
		}
	}, [props.isCollapsed]);

	if (Platform.isMobile) {
		return (
			<div
				className={toClassName(itemElClasses)}
				data-type={props.dataType}
				data-id={props.dataId}
				style={{ minHeight: props.isCollapsed ? 0 : height }}
				ref={props.ref}
			>
				<div
					className={toClassName(selfElClasses)}
					onClick={props.onClick}
					onTouchStart={props.onTouchStart}
					onTouchMove={props.onTouchMove}
					onTouchEnd={props.onTouchEnd}
					onAuxClick={props.onAuxClick}
					onDoubleClick={props.onDoubleClick}
					onContextMenu={props.onContextMenu}
				>
					<div className="tree-item-icon" ref={iconEl}></div>
					<div className="tree-item-inner">
						<div className="tree-item-inner-text">
							{props.title}
						</div>
					</div>
					<div className="tree-item-flair-outer">
						{props.toolbar}
						<div
							className="drag-handle"
							ref={props.id ? setNodeRef : null}
							{...attributes}
							{...listeners}
						>
							<IconButton
								icon="grip-vertical"
								action="drag-handle"
							/>
						</div>
					</div>
				</div>
				{!props.isCollapsed && !isDragging && (
					<div className="tree-item-children">{props.children}</div>
				)}
			</div>
		);
	} else {
		return (
			<div
				className={toClassName(itemElClasses)}
				data-type={props.dataType}
				data-id={props.dataId}
				style={{ minHeight: props.isCollapsed ? 0 : height }}
				ref={props.ref}
			>
				<div
					className={toClassName(selfElClasses)}
					onClick={props.onClick}
					onAuxClick={props.onAuxClick}
					onDoubleClick={props.onDoubleClick}
					onContextMenu={props.onContextMenu}
					ref={props.id ? setNodeRef : null}
					{...attributes}
					{...listeners}
				>
					<div className="tree-item-icon" ref={iconEl}></div>
					<div className="tree-item-inner">
						<div className="tree-item-inner-text">
							{props.title}
						</div>
					</div>
					<div className="tree-item-flair-outer">{props.toolbar}</div>
				</div>
				{!props.isCollapsed && !isDragging && (
					<div className="tree-item-children">{props.children}</div>
				)}
			</div>
		);
	}
};
