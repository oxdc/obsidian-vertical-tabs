import { Platform, setIcon } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";
import { IconButton } from "./IconButton";
import { Identifier } from "src/models/VTWorkspace";
import { ViewCueIndex } from "src/models/ViewState";
import {
	DroppableItem,
	useDNDActions,
	useDNDManager,
} from "src/stores/DNDManager";

interface NavigationTreeItemProps {
	id: Identifier | null;
	item: DroppableItem | null;
	index?: ViewCueIndex;
	ref?: React.RefObject<HTMLDivElement | null>;
	title: string | React.ReactNode;
	icon: string;
	isTab: boolean;
	isEphemeralTab?: boolean;
	isTabSlot?: boolean;
	isLinkedGroupBtn?: boolean;
	isGroupSlot?: boolean;
	isSingleGroup?: boolean;
	isLinkedGroup?: boolean;
	isActive?: boolean;
	isActiveGroup?: boolean;
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
	onMouseOver?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
	dataType?: string;
	dataId?: string;
}

export const NavigationTreeItem = (props: NavigationTreeItemProps) => {
	const { selectOne, setOverItem, setIsDragging } = useDNDActions();
	const [isOver, setIsOver] = useState(false);

	const onDragStart = (event: React.DragEvent<HTMLDivElement>) => {
		if (!props.item || props.isTabSlot || props.isGroupSlot) return;
		if (!(typeof props.item === "string")) {
			selectOne(props.item);
		}
		setIsDragging(true);
	};

	const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		setOverItem(props.item);
		setIsOver(true);
	};

	const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
		setIsOver(false);
	};

	const isDragging = useDNDManager((state) => state.isDragging);
	const selectedItems = useDNDManager((state) => state.selectedItems);
	const isBeingDragged =
		isDragging &&
		props.item !== null &&
		typeof props.item !== "string" &&
		selectedItems.includes(props.item);

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
		"is-being-dragged": isBeingDragged,
		"vt-is-being-dragged-over": isOver,
		"is-tab-slot": props.isTabSlot,
		"is-linked-btn": props.isLinkedGroupBtn,
		"is-group-slot": props.isGroupSlot,
		"is-single-group": props.isSingleGroup,
		"is-active-group": props.isActiveGroup,
		"is-linked-group": props.isLinkedGroup,
		"is-slot": props.isTabSlot || props.isGroupSlot,
		"is-highlighted": props.isHighlighted,
	};
	const selfElClasses: CssClasses = {
		"tree-item-self": true,
		"is-clickable": true,
		"is-active": props.isActive,
		"is-being-dragged": isBeingDragged,
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
					<div
						className="tree-item-flair-outer"
						onClick={(e) => e.stopPropagation()}
					>
						{props.toolbar}
						<div className="drag-handle">
							<IconButton
								icon="grip-vertical"
								action="drag-handle"
							/>
						</div>
					</div>
				</div>
				{!props.isCollapsed && !isBeingDragged && (
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
					onMouseOver={props.onMouseOver}
					data-index={props.index}
					onDragStart={onDragStart}
					onDragOver={onDragOver}
					onDragLeave={onDragLeave}
					draggable
				>
					<div className="tree-item-icon" ref={iconEl}></div>
					<div className="tree-item-inner">
						<div className="tree-item-inner-text">
							{props.title}
						</div>
					</div>
					<div
						className="tree-item-flair-outer"
						onClick={(e) => e.stopPropagation()}
					>
						{props.toolbar}
					</div>
				</div>
				{!props.isCollapsed && !isBeingDragged && (
					<div className="tree-item-children">{props.children}</div>
				)}
			</div>
		);
	}
};
