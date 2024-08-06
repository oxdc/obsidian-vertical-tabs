import { create } from "zustand";
import { DEFAULT_SESSION, LATEST_SESSION_VERSION, Session } from "./SessionsV1";
import { persist } from "zustand/middleware";

export interface SessionStore extends Session {
	placeholder: string;
}

export const useSessions = create<SessionStore>()(
	persist(
		(set) => ({
			...DEFAULT_SESSION[LATEST_SESSION_VERSION],
			placeholder: "",
		}),
		{
			name: "session",
		}
	)
);
