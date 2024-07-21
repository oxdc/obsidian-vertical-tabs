import { useApp } from "src/hooks";

export const ReactView = () => {
	const app = useApp();
	return <h4>Hello, React! {app?.vault.getName()}</h4>;
};
