import { TabCache } from "src/models/TabCache";
import { Tab } from "./Tab";
import { Group } from "./Group";

interface NavigationContentProps {
	tabs: TabCache;
}

export const NavigationContent = (props: NavigationContentProps) => {
	const groups = Array.from(props.tabs.entries());

	return (
		<div className="vertical-tabs-container ">
			<div>
				{groups.map(([group, leaves]) => (
					<Group key={group} id={group}>
						{leaves.map((leaf) => (
							<Tab key={leaf.id} leaf={leaf} />
						))}
					</Group>
				))}
			</div>
		</div>
	);
};
