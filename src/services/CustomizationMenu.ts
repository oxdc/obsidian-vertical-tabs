import { Menu } from "obsidian";
import { PREDEFINED_COLORS } from "src/constants/Predefined";

export const addColorOptionsToMenu = (
	menu: Menu,
	setColor: (color: string) => void,
	resetColor: () => void
) => {
	menu.addItem((item) =>
		item.setSection("color").setTitle("Default").onClick(resetColor)
	);
	for (const [name, color] of PREDEFINED_COLORS) {
		menu.addItem((item) =>
			item
				.setSection("color")
				.setTitle(name)
				.onClick(() => setColor(color))
		);
	}
};
