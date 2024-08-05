import { useApp, useSettings } from "src/models/PluginContext";
import { IconButton } from "./IconButton";
import { Menu } from "obsidian";
import { sortStrategies, useTabCache } from "src/models/TabCache";
import * as VT from "src/models/VTWorkspace";

export const NavigationHeader = () => {
	const app = useApp();
	const [settings, setSettings] = useSettings();
	const { sortStrategy, setSortStrategy } = useTabCache();

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

	const toggleZenMode = () => {
		const view = (app.workspace as VT.Workspace).getActiveFileView();
		setSettings({
			zenMode: !settings.zenMode,
		});
		const leaf = view.leaf as VT.WorkspaceLeaf;
		app.workspace.setActiveLeaf(leaf, { focus: true });
		leaf.parent.recomputeChildrenDimensions();
	};

	const sortMenu = new Menu();
	sortMenu.addItem((item) => {
		item.setTitle("Disable").onClick(() => setSortStrategy(null));
	});
	sortMenu.addItem((item) => {
		item.setTitle("Title name (A to Z)")
			.onClick(() => setSortStrategy(sortStrategies.titleAToZ))
			.setChecked(sortStrategy === sortStrategies.titleAToZ);
	});
	sortMenu.addItem((item) => {
		item.setTitle("Title name (Z to A)")
			.onClick(() => setSortStrategy(sortStrategies.titleZToA))
			.setChecked(sortStrategy === sortStrategies.titleZToA);
	});
	sortMenu.addSeparator();
	sortMenu.addItem((item) => {
		item.setTitle("Pinned at top")
			.onClick(() => setSortStrategy(sortStrategies.pinnedAtTop))
			.setChecked(sortStrategy === sortStrategies.pinnedAtTop);
	});
	sortMenu.addItem((item) => {
		item.setTitle("Pinned at bottom")
			.onClick(() => setSortStrategy(sortStrategies.pinnedAtBottom))
			.setChecked(sortStrategy === sortStrategies.pinnedAtBottom);
	});
	sortMenu.addSeparator();
	sortMenu.addItem((item) => {
		item.setTitle("Recent on top")
			.onClick(() => setSortStrategy(sortStrategies.recentOnTop))
			.setChecked(sortStrategy === sortStrategies.recentOnTop);
	});
	sortMenu.addItem((item) => {
		item.setTitle("Recent on bottom")
			.onClick(() => setSortStrategy(sortStrategies.recentOnBottom))
			.setChecked(sortStrategy === sortStrategies.recentOnBottom);
	});

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
				<IconButton
					icon="arrow-up-narrow-wide"
					action="sort-tabs"
					tooltip="Sort tabs"
					onClick={(e) => sortMenu.showAtMouseEvent(e.nativeEvent)}
					isNavAction={true}
				/>
				<IconButton
					icon="focus"
					action="zen-mode"
					tooltip="Zen mode"
					onClick={toggleZenMode}
					isActive={settings.zenMode}
					isNavAction={true}
				/>
			</div>
		</div>
	);
};
