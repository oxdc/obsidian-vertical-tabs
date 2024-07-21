import { useApp } from "hooks";

export const ReactView = () => {
	const app = useApp();
	return <h4>Hello, React! {app?.vault.getName()}</h4>;
};
