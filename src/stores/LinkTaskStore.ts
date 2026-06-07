import { createStoreWithActions } from "../models/StoreWithActions";
import { TFile, OpenViewState } from "obsidian";

export type OpenFileTask = {
	type: "openFile";
	file: TFile;
	openState?: OpenViewState;
};

export type OpenLinkTextTask = {
	type: "openLinkText";
	name: string;
	subpath: string;
};

export type LinkTask = OpenFileTask | OpenLinkTextTask;

type LinkTaskRecord = Map<string, LinkTask>;

type LinkTaskState = {
	tasks: LinkTaskRecord;
};

type LinkTaskActions = {
	addOpenFileTask: (file: TFile, openState?: OpenViewState) => void;
	addOpenLinkTextTask: (name: string, subpath: string) => void;
	removeTask: (key: string) => void;
	getTask: (key: string) => LinkTask | null;
};

type LinkTaskStore = LinkTaskState & {
	actions: LinkTaskActions;
};

export const linkTasksStore = createStoreWithActions<LinkTaskStore>(
	(set, get) => ({
		tasks: new Map(),
		actions: {
			addOpenFileTask(file: TFile, openState?: OpenViewState) {
				if (!file) return;
				const { tasks } = get();
				const key = file.path;
				tasks.set(key, { type: "openFile", file, openState });
				set({ tasks });
			},
			addOpenLinkTextTask(name: string, subpath: string) {
				if (!name) return;
				const { tasks } = get();
				tasks.set(name, { type: "openLinkText", name, subpath });
				set({ tasks });
			},
			removeTask(key: string) {
				const { tasks } = get();
				tasks.delete(key);
				set({ tasks });
			},
			getTask(key: string): LinkTask | null {
				const { tasks } = get();
				let task: LinkTask | null = null;
				for (const [taskKey, value] of tasks) {
					if (key.endsWith(taskKey) || taskKey.endsWith(key)) {
						task = value;
						break;
					}
				}
				return task;
			},
		},
	})
);
