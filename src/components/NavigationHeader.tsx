import { usePlugin, useSettings } from "src/models/PluginContext";
import { IconButton } from "./IconButton";
import { Menu } from "obsidian";
import { sortStrategies, useTabCache } from "src/models/TabCache";
import { useViewState } from "src/models/ViewState";

export const NavigationHeader = () => {
	const plugin = usePlugin();
	const showActiveTabs = useSettings.use.showActiveTabs();
	const toggleTabVisibility = useSettings.use.toggleTabVisibility();
	const hideSidebars = useSettings.use.hideSidebars();
	const toggleSidebarVisibility = useSettings.use.toggleSidebarVisibility();
	const zenMode = useSettings.use.zenMode();
	const toggleZenMode = useSettings.use.toggleZenMode();
	const sortStrategy = useTabCache((state) => state.sortStrategy);
	const { setSortStrategy } = useTabCache();
	const { lockFocus, setAllCollapsed, setAllExpanded } = useViewState();
	const globalCollapseState = useViewState(
		(state) => state.globalCollapseState
	);

	const createAndShowNewTab = () => {
		const workspace = plugin.app.workspace;
		const leaf = workspace.getLeaf(true);
		workspace.setActiveLeaf(leaf, { focus: true });
		workspace.onLayoutChange();
	};

	const toggleZenModeAndLockFocus = () => {
		toggleZenMode();
		lockFocus(plugin);
		const workspace = plugin.app.workspace;
		workspace.trigger("vertical-tabs:update-toggle");
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
					icon="plus"
					action="new-tab"
					tooltip="New tab"
					onClick={createAndShowNewTab}
					isNavAction={true}
				/>
				<IconButton
					icon="app-window"
					action="toggle-tab"
					tooltip="Show active tabs"
					onClick={toggleTabVisibility}
					isActive={showActiveTabs}
					isNavAction={true}
				/>
				<IconButton
					icon="panel-left"
					action="toggle-sidebar"
					tooltip="Hide sidebars"
					onClick={toggleSidebarVisibility}
					isActive={hideSidebars}
					isNavAction={true}
				/>
				<IconButton
					icon="arrow-up-narrow-wide"
					action="sort-tabs"
					tooltip="Sort tabs"
					onClick={(e) => sortMenu.showAtMouseEvent(e.nativeEvent)}
					isActive={sortStrategy !== null}
					isNavAction={true}
				/>
				<IconButton
					icon="focus"
					action="zen-mode"
					tooltip="Zen mode"
					onClick={toggleZenModeAndLockFocus}
					isActive={zenMode}
					isNavAction={true}
				/>
				<IconButton
					icon={
						globalCollapseState
							? "unfold-vertical"
							: "fold-vertical"
					}
					action="global-collapse"
					tooltip={
						globalCollapseState ? "Expand all" : "Collapse all"
					}
					onClick={() =>
						globalCollapseState
							? setAllExpanded()
							: setAllCollapsed()
					}
					isNavAction={true}
				/>
			</div>
		</div>
	);
};
