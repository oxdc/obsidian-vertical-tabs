import * as VT from "src/models/VTWorkspace";
import { NavigationTreeItem } from "./NavigationTreeItem";

interface GroupProps {
	id: VT.Identifier;
	children?: React.ReactNode;
}

export const Group = ({ id, children }: GroupProps) => {
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
		icon: "folder",
	};

	return (
		<NavigationTreeItem isTab={false} {...props}>
			{children}
		</NavigationTreeItem>
	);
};
