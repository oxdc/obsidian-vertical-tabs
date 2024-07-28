import { usePlugin } from "src/hooks";
import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";

export const NavigationContainer = () => {
	const plugin = usePlugin();

	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent />
		</div>
	);
};
