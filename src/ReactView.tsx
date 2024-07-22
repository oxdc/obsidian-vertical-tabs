import { useEffect, useRef, useState } from "react";
import { useApp } from "src/hooks";
import { getGroupedLeaves, GroupedLeaves } from "./leaves";
import { setIcon } from "obsidian";

export const ReactView = () => {
	const app = useApp();
	const icon = useRef<HTMLDivElement>(null);
	const [tabs, setTabs] = useState<GroupedLeaves>(getGroupedLeaves(app));

	useEffect(() => {
		setIcon(icon.current as HTMLElement, "caret-right");
	}, [icon]);

	useEffect(() => {
		app.workspace.on("layout-change", () => {
			setTabs(getGroupedLeaves(app));
		});
	}, []);

	const tabsArray = Array.from(tabs.entries());

	return (
		<div>
			<h4>Hello, React! {app?.vault.getName()}</h4>
			<div>
				{tabsArray.map(([groupId, leaves]) => (
					<div className="tree-item" key={groupId}>
						<div className="tree-item-self is-clickable mod-collapsible">
							<div
								className="tree-item-icon collapse-icon"
								ref={icon}
							></div>
							<div className="tree-item-inner">
								<div className="tree-item-inner-text">
									Grouped Tabs
								</div>
							</div>
						</div>
						<div className="tree-item-children">
							{leaves.map((leaf) => (
								<div
									className="tree-item"
									key={(leaf as any).id}
								>
									<div className="tree-item-self is-clickable tappable">
										<div className="tree-item-inner">
											<div className="tree-item-inner-text">
												{leaf.getDisplayText()}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
