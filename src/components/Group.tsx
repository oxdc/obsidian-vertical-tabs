import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";
import { useState } from "react";

interface GroupProps {
	id: VT.Identifier;
	children?: React.ReactNode;
}

export const Group = ({ id, children }: GroupProps) => {
	const isSidebar = id === "left-sidedock" || id === "right-sidedock";
	const [isCollapsed, setIsCollapsed] = useState(isSidebar ? true : false);
	const toggle = () => setIsCollapsed(!isCollapsed);

	const mapToTitle = (id: VT.Identifier) => {
		switch (id) {
			case "left-sidedock":
				return "Left Sidebar";
			case "right-sidedock":
				return "Right Sidebar";
			default:
				return "Grouped Tabs";
		}
	};

	const props = {
		title: mapToTitle(id),
		icon: "right-triangle",
		isCollapsed,
	};

	return (
		<NavigationTreeItem isTab={false} {...props} onClick={toggle}>
			{children}
		</NavigationTreeItem>
	);
};
