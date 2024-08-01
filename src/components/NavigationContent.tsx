import { TabCache } from "src/models/TabCache";
import { Tab } from "./Tab";
import { Group } from "./Group";

interface NavigationContentProps {
	tabs: TabCache;
}

export const NavigationContent = (props: NavigationContentProps) => {
	const groups = Array.from(props.tabs.entries());

	return (
		<div className="obsidian-vertical-tabs-container node-insert-event">
			<div>
				{groups.map(([group, entry]) => (
					<Group key={group} type={entry.groupType}>
						{entry.leaves.map((leaf) => (
							<Tab key={leaf.id} leaf={leaf} />
						))}
					</Group>
				))}
			</div>
		</div>
	);
};
