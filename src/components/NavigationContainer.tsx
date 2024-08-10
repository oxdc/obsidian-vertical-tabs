import { NavigationContent } from "./NavigationContent";
import { NavigationHeader } from "./NavigationHeader";
import { REFRESH_TIMEOUT, useTabCache } from "src/models/TabCache";
import { usePlugin } from "src/models/PluginContext";
import { useEffect } from "react";
import { useViewState } from "src/models/ViewState";
import { createPortal } from "react-dom";
import { IconButton } from "./IconButton";
import * as VT from "../models/VTWorkspace";

export const NavigationContainer = () => {
	const plugin = usePlugin();
	const { tabs, refresh, sort } = useTabCache();
	const { setActiveLeaf } = useViewState();

	const autoRefresh = () => {
		setActiveLeaf(plugin);
		setTimeout(() => {
			refresh(plugin.app);
			sort();
		}, REFRESH_TIMEOUT);
	};

	useEffect(() => {
		autoRefresh();
		plugin.registerEvent(
			plugin.app.workspace.on("layout-change", autoRefresh)
		);
		plugin.registerEvent(
			plugin.app.workspace.on("active-leaf-change", autoRefresh)
		);
	}, []);

	useEffect(() => {
		const workspace = plugin.app.workspace as VT.Workspace;
		const { leftSidebarToggleButtonEl } = workspace;
		document.documentElement.style.setProperty(
			"--left-sidebar-toggle-button-offset",
			leftSidebarToggleButtonEl.offsetLeft + "px"
		);
	}, []);

	const { leftSplit, rightSplit } = plugin.app.workspace;

	return (
		<div className="vertical-tabs">
			<NavigationHeader />
			<NavigationContent tabs={tabs} />
			{createPortal(
				<div className="sidebar-toggle-buttons">
					<div className="sidebar-toggle-button mod-left">
						<IconButton
							icon="sidebar-left"
							action="toggle-left-sidebar"
							tooltip={
								leftSplit.collapsed ? "Expand" : "Collapse"
							}
							onClick={() => leftSplit.toggle()}
						/>
					</div>
					<div className="sidebar-toggle-button mod-right">
						<IconButton
							icon="sidebar-right"
							action="toggle-right-sidebar"
							tooltip={
								rightSplit.collapsed ? "Expand" : "Collapse"
							}
							onClick={() => rightSplit.toggle()}
						/>
					</div>
				</div>,
				document.body
			)}
		</div>
	);
};
