import { usePlugin, useSettings } from "src/models/PluginContext";
import { IconButton } from "./IconButton";
import { Menu, Platform } from "obsidian";
import {
	REFRESH_TIMEOUT_LONG,
	sortStrategies,
	useTabCache,
} from "src/models/TabCache";
import { useViewState } from "src/models/ViewState";

interface NavigationHeaderProps {
	container: HTMLElement | null;
}

export const NavigationHeader = (props: NavigationHeaderProps) => {
	const plugin = usePlugin();
	const app = plugin.app;
	const { hasOnlyOneGroup } = useTabCache();
	const { setSettings } = useSettings();
	const showActiveTabs = useSettings.use.showActiveTabs();
	const hideSidebars = useSettings.use.hideSidebars();
	const zenMode = useSettings.use.zenMode();
	const toggleZenMode = useSettings.use.toggleZenMode();
	const useTabEditing = useSettings.use.useTabEditing();
	const sortStrategy = useTabCache((state) => state.sortStrategy);
	const { setSortStrategy } = useTabCache();
	const { lockFocus, setAllCollapsed, setAllExpanded, scorllToActiveTab } =
		useViewState();
	const globalCollapseState = useViewState(
		(state) => state.globalCollapseState
	);
	const { uncollapseActiveGroup, setIsEditingTabs } = useViewState();
	const isSingleGroup = hasOnlyOneGroup() && hideSidebars;
	const isEditingTabs = useViewState((state) => state.isEditingTabs);

	const toggleTabVisibility = () =>
		setSettings({ showActiveTabs: !showActiveTabs });
	const toggleSidebarVisibility = () =>
		setSettings({ hideSidebars: !hideSidebars });

	const toggleZenModeAndLockFocus = () => {
		toggleZenMode();
		lockFocus(plugin);
		const workspace = app.workspace;
		workspace.trigger("vertical-tabs:update-toggle");
	};

	const toggleEditingTabs = () => {
		setIsEditingTabs(app, !isEditingTabs);
		props.container?.toggleClass("editing-tabs", !isEditingTabs);
	};

	const revealActiveTab = () => {
		uncollapseActiveGroup(app);
		setTimeout(() => {
			scorllToActiveTab();
		}, REFRESH_TIMEOUT_LONG);
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
		<div className="nav-header obsidian-vertical-tabs-toolbar">
			<div className="nav-buttons-container">
				<IconButton
					icon="app-window"
					action="toggle-tab"
					tooltip="Show active tabs only"
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
					icon="crosshair"
					action="reveal-tab"
					tooltip="Reveal active tab"
					disabled={isSingleGroup}
					onClick={revealActiveTab}
					isNavAction={true}
				/>
				<IconButton
					icon={
						globalCollapseState
							? "chevrons-up-down"
							: "chevrons-down-up"
					}
					action="global-collapse"
					tooltip={
						globalCollapseState ? "Expand all" : "Collapse all"
					}
					disabled={isSingleGroup}
					onClick={() =>
						globalCollapseState
							? setAllExpanded()
							: setAllCollapsed()
					}
					isNavAction={true}
				/>
				{Platform.isMobile && useTabEditing && (
					<IconButton
						icon="copy-check"
						action="editing-tabs"
						tooltip="Edit tabs"
						onClick={toggleEditingTabs}
						isActive={isEditingTabs}
						isNavAction={true}
					/>
				)}
			</div>
		</div>
	);
};
