import { TabCache } from "src/models/TabCache";
import { NavigationTabItem } from "./NavigationTreeItem";

interface NavigationContentProps {
	tabs: TabCache;
}

export const NavigationContent = (props: NavigationContentProps) => {
	const groups = Array.from(props.tabs.entries());

	return (
		<div className="vertical-tabs-container ">
			<div>
				{groups.map(([parentID, leaves]) => (
					<NavigationTabItem
						key={parentID}
						title={parentID}
						icon="folder"
					>
						{leaves.map((leaf) => (
							<NavigationTabItem
								key={leaf.id}
								title={leaf.getDisplayText()}
								icon={leaf.getIcon()}
							/>
						))}
					</NavigationTabItem>
				))}
			</div>
		</div>
	);
};
