import { CssClasses, toClassName } from "src/utils/CssClasses";

interface TabSlotProps {
	isHidden?: boolean;
}

export const TabSlot = ({ isHidden }: TabSlotProps) => {
	const tabSlotClasses: CssClasses = {
		"tree-item": true,
		"is-tab": true,
		"tab-slot": true,
		"is-hidden": isHidden,
	};
	return <div className={toClassName(tabSlotClasses)}></div>;
};
