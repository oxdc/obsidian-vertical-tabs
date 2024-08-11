import { create } from "zustand";
import { App, HexString } from "obsidian";
import { refreshSession } from "src/services/SessionRefresh";
import * as VT from "./VTWorkspace";
import { DefaultRecord } from "src/utils/DefaultRecord";
import { MainLayout } from "./Layout";

enum PredefinedColor {
	Red = "--color-red",
	Orange = "--color-orange",
	Yellow = "--color-yellow",
	Green = "--color-green",
	Blue = "--color-blue",
	Purple = "--color-purple",
	Pink = "--color-pink",
}

type Color = PredefinedColor | HexString | null;

export interface SessionGroup {
	id: VT.Identifier;
	type: VT.GroupType;
	icon: string;
	name: string;
	color: Color;
	children: VT.Identifier[];
	ref: VT.WorkspaceParent | null;
}

export interface SessionTab {
	id: VT.Identifier;
	icon: string;
	name: string;
	level: number;
	ref: VT.WorkspaceLeaf | null;
}

export interface Session {
	version: 1;
	id: VT.Identifier;
	name: string;
	groups: Map<VT.Identifier, SessionGroup>;
	tabs: Map<VT.Identifier, SessionTab>;
	latestActiveTab: VT.Identifier | null;
	layout: MainLayout | null;
}

export const DEFAULT_SESSION: Session = {
	version: 1,
	id: VT.generateId(),
	name: "New session",
	groups: new Map(),
	tabs: new Map(),
	latestActiveTab: null,
	layout: null,
};

export interface SessionActions {
	refresh: (app: App) => void;
}

export type SessionStore = Session & SessionActions;

export const useSessions = create<SessionStore>()((set, get) => ({
	...DEFAULT_SESSION,
	refresh: (app: App) => set((state) => refreshSession(app, state)),
}));
