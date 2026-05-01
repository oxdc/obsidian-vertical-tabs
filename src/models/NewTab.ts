export enum NewTabButtonPlacement {
	GroupToolbar = "group-toolbar",
	TabSlot = "tab-slot",
	Both = "both",
}

export const NewTabButtonPlacementOptions: Record<string, string> = {
	[NewTabButtonPlacement.GroupToolbar]: "Group toolbar (default)",
	[NewTabButtonPlacement.TabSlot]: "At the bottom of each group",
	[NewTabButtonPlacement.Both]: "Both places",
};
