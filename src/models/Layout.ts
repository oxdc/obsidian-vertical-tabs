import * as Obsidian from "obsidian";
import * as VT from "./VTWorkspace";

export interface Layout {
	main: MainLayout;
	left: SidebarLayout;
	right: SidebarLayout;
	leftRibbon: Ribbon;
	active: string | null;
}

export interface LayoutItem {
	id: VT.Identifier;
	type: string;
}

export interface LayoutSplit extends LayoutItem {
	type: "split";
	direction: "vertical" | "horizontal";
	children: LayoutSplit[] | LayoutTabs[];
}

export interface LayoutTabs extends LayoutItem {
	type: "tabs";
	currentTab?: number;
	children: LayoutLeaf[];
}

export interface LayoutLeaf extends LayoutItem {
	type: "leaf";
	state: Obsidian.ViewState;
}

export type MainLayout = LayoutSplit;

export interface SidebarLayout extends LayoutSplit {
	width: number;
	children: LayoutTabs[];
}

export interface Ribbon {
	hiddenItems: RibbonList;
}

export type RibbonList = {
	[key: string]: boolean;
};
