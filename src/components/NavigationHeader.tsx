import { useSettings } from "src/models/PluginContext";
import { IconButton } from "./IconButton";

export const NavigationHeader = () => {
	const [settings, setSettings] = useSettings();

	const toggleTabVisibility = () => {
		setSettings({
			showActiveTabs: !settings.showActiveTabs,
		});
	};

	const toggleSidebarVisibility = () => {
		setSettings({
			hideSidebars: !settings.hideSidebars,
		});
	};

	return (
		<div className="nav-header">
			<div className="nav-buttons-container">
				<IconButton
					icon="app-window"
					action="toggle-tab"
					tooltip="Show active tabs"
					onClick={toggleTabVisibility}
					isActive={settings.showActiveTabs}
					isNavAction={true}
				/>
				<IconButton
					icon="panel-left"
					action="toggle-sidebar"
					tooltip="Hide sidebars"
					onClick={toggleSidebarVisibility}
					isActive={settings.hideSidebars}
					isNavAction={true}
				/>
			</div>
		</div>
	);
};
