export enum NewTabButtonPlacement {
	None = "none",
	GroupToolbar = "group-toolbar",
	TabSlot = "tab-slot",
	Both = "both",
}

export const NewTabButtonPlacementOptions: Record<string, string> = {
	[NewTabButtonPlacement.None]: "Disable",
	[NewTabButtonPlacement.GroupToolbar]: "Group toolbar (default)",
	[NewTabButtonPlacement.TabSlot]: "At the bottom of each group",
	[NewTabButtonPlacement.Both]: "Both places",
};
