import { createStoreWithActions } from "./StoreWithActions";

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

export const linkTasksStore = createStoreWithActions<LinkTaskStore>(
	(set, get) => ({
		tasks: new Map(),
		actions: {
			addTask(name: string, subpath: string) {
				if (!name || !subpath) return;
				const { tasks } = get();
				tasks.set(name, { name, subpath });
				console.log("tasks", tasks);
				set({ tasks });
			},
			removeTask(name: string) {
				const { tasks, actions } = get();
				const task = actions.getTask(name);
				if (!task) return;
				tasks.delete(task.name);
				console.log("removed", task);
				set({ tasks });
			},
			getTask(name: string) {
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
	})
);
