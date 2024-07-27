import { useContext } from "react";
import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { TabManagerContext } from "src/context";

export const NavigationContainer = () => {
	const tabManager = useContext(TabManagerContext);

	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent />
			<button onClick={tabManager?.refreshTabs.bind(tabManager)}>
				Refresh Tabs
			</button>
			<div>{JSON.stringify(tabManager?.cachedTabs)}</div>
		</div>
	);
};
