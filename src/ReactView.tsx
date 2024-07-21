import { useApp, usePlugin } from "src/hooks";

export const ReactView = () => {
	const app = useApp();
	const plugin = usePlugin();
	return (
		<div>
			<h4>Hello, React! {app?.vault.getName()}</h4>
			<button onClick={() => console.log(plugin.groupedLeaves)}>
				Refresh
			</button>
		</div>
	);
};
