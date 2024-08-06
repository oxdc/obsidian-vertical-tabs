import { nanoid } from "nanoid";
import * as VT from "./VTWorkspace";
import { MainLayout } from "./Layout";

enum Color {}

export interface SessionGroupV1 {
	id: VT.Identifier;
	icon: string;
	name: string;
	color: Color;
	tabs: VT.Identifier[];
}

export interface SessionTabV1 {
	id: VT.Identifier;
	icon: string;
	name: string;
}

export interface SessionV1 {
	version: 1;
	id: VT.Identifier;
	name: string;
	groups: Record<VT.Identifier, SessionGroupV1>;
	tabs: Record<VT.Identifier, SessionTabV1>;
	activeTab: VT.Identifier | null;
	layout: MainLayout | null;
}

export const DEFUALT_SESSION_V1: SessionV1 = {
	version: 1,
	id: nanoid(),
	name: "New session",
	groups: {},
	tabs: {},
	activeTab: null,
	layout: null,
};

export type SessionDefaults = {
	[1]: SessionV1;
};

export const LATEST_SESSION_VERSION = 1;
export type Session = SessionV1;
export const DEFAULT_SESSION: SessionDefaults = {
	1: DEFUALT_SESSION_V1,
};
