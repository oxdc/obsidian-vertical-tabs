import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";

export const VerticalTabsView = () => {
	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent />
		</div>
	);
};
