import { IconButton } from "./IconButton";

export const TabToolbar = () => {
	return (
		<div className="tab-toolbar">
			<IconButton icon="pin" action="pin" tooltip="Pin tab" />
			<IconButton icon="close" action="close" tooltip="Close tab" />
		</div>
	);
};
