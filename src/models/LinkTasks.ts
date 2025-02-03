import { createStore } from "zustand";
import { actions } from "./StoreWithActions";

export type LinkTask = {
	name: string;
	subpath: string;
};

type LinkTaskRecord = Map<string, LinkTask>;

type LinkTaskActions = {
	addTask: (path: string, subpath: string) => void;
	removeTask: (path: string) => void;
	getTask: (path: string) => LinkTask | null;
};

type LinkTaskStates = {
	tasks: LinkTaskRecord;
};

type LinkTaskStore = LinkTaskStates & {
	actions: LinkTaskActions;
};

export const linkTasksStore = createStore<LinkTaskStore>()(
	actions<LinkTaskStore, () => LinkTaskActions, [], []>((set, get) => ({
		tasks: new Map(),
		actions: {
			addTask: (name, subpath) => {
				if (!name || !subpath) return;
				const { tasks } = get();
				tasks.set(name, { name, subpath });
				set({ tasks });
			},
			removeTask: (name) => {
				const { tasks, actions } = get();
				const task = actions.getTask(name);
				if (!task) return;
				tasks.delete(task.name);
				set({ tasks });
			},
			getTask: (name) => {
				const { tasks } = get();
				let task: LinkTask | null = null;
				for (const [key, value] of tasks) {
					if (name.endsWith(key) || key.endsWith(name)) {
						task = value;
						break;
					}
				}
				return task;
			},
		},
	}))
);
