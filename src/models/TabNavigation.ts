export enum TabNavigationStrategy {
	ObsidianPlus = "obsidian-plus",
	Obsidian = "obsidian",
	IDE = "ide",
	Explorer = "explorer",
	Notebook = "notebook",
	PreferNewTab = "prefer-new-tab",
	Custom = "custom",
}

export const TabNavigationStrategyOptions: Record<string, string> = {
	[TabNavigationStrategy.ObsidianPlus]: "Obsidian+",
	[TabNavigationStrategy.Obsidian]: "Obsidian",
	[TabNavigationStrategy.IDE]: "IDE",
	[TabNavigationStrategy.Explorer]: "Explorer",
	[TabNavigationStrategy.Notebook]: "Notebook",
	[TabNavigationStrategy.PreferNewTab]: "Prefer new tab",
	[TabNavigationStrategy.Custom]: "Custom",
};

export function convertNameToStrategy(name: string): TabNavigationStrategy {
  return name as TabNavigationStrategy;
}
