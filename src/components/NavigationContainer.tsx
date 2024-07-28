import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { useTabCache } from "src/models/TabCache";
import { useApp } from "src/models/AppContext";
import { useEffect } from "react";

export const NavigationContainer = () => {
	const app = useApp();
	const { tabs, refresh } = useTabCache();

	useEffect(() => {
		refresh(app);
		app.workspace.on("layout-change", () => {
			refresh(app);
		});
	}, []);

	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent tabs={tabs} />
		</div>
	);
};
