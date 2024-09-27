import { Platform, setIcon } from "obsidian";
import { useEffect, useRef, useState } from "react";
import { CssClasses, toClassName } from "src/utils/CssClasses";
import * as VT from "src/models/VTWorkspace";
import { useSortable } from "@dnd-kit/sortable";
import { IconButton } from "./IconButton";
import { sortStrategies, useTabCache } from "src/models/TabCache";
import { useViewState } from "src/models/ViewState";
import { useApp } from "src/models/PluginContext";

interface NavigationTreeItemProps {
	id: VT.Identifier | null;
	title: string | React.ReactNode;
	icon: string;
	isTab: boolean;
	isTabSlot?: boolean;
	isGroupSlot?: boolean;
	isActive?: boolean;
	isRenaming?: boolean;
	isPinned?: boolean;
	isCollapsed?: boolean;
	isSidebar?: boolean;
	isHighlighted?: boolean;
	children?: React.ReactNode;
	toolbar?: React.ReactNode;
	onClick?: (event?: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
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
	const sortStrategy = useTabCache((state) => state.sortStrategy);
	const app = useApp();
	const DND = useViewState((state) => state.DND);
	const draggingPinned = !!(
		DND.activeID &&
		app.workspace.getLeafById(DND.activeID)?.getViewState().pinned
	);

	let disableDrop = false;

	if (props.isTab) {
		switch (sortStrategy) {
			case sortStrategies.titleAToZ:
			case sortStrategies.titleZToA:
				disableDrop = !props.isTabSlot;
				break;
			case sortStrategies.pinnedAtTop:
			case sortStrategies.pinnedAtBottom:
				disableDrop =
					(!draggingPinned && props.isPinned) ||
					(draggingPinned && !props.isPinned);
				break;
			case sortStrategies.recentOnTop:
			case sortStrategies.recentOnBottom:
				disableDrop = true;
				break;
		}
	}

	const { attributes, listeners, setNodeRef, isDragging, isOver } =
		useSortable({
			id: props.id ?? "",
			data: { isTab: props.isTab && !props.isTabSlot },
			disabled: props.id === null || {
				droppable: disableDrop,
			},
		});

	const iconEl = useRef<HTMLDivElement>(null);
	const [height, setHeight] = useState(0);

	const itemElClasses: CssClasses = {
		"tree-item": true,
		"is-tab": props.isTab,
		"is-group": !props.isTab,
		"is-pinned": props.isPinned,
		"is-collapsed": props.isCollapsed,
		"is-sidebar": props.isSidebar,
		"is-dragging-self": isDragging,
		"is-dragging-over": isOver,
		"is-tab-slot": props.isTabSlot,
		"is-group-slot": props.isGroupSlot,
		"is-slot": props.isTabSlot || props.isGroupSlot,
		"is-highlighted": props.isHighlighted,
	};
	const selfElClasses: CssClasses = {
		"tree-item-self": true,
		"is-clickable": true,
		"is-active": props.isActive,
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
			>
				<div
					className={toClassName(selfElClasses)}
					onClick={props.onClick}
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
							ref={props.id && setNodeRef}
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
			>
				<div
					className={toClassName(selfElClasses)}
					onClick={props.onClick}
					onAuxClick={props.onAuxClick}
					onDoubleClick={props.onDoubleClick}
					onContextMenu={props.onContextMenu}
					ref={props.id && setNodeRef}
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
