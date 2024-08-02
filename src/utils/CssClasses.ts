export type CssClasses = {
	[key: string]: boolean | null | undefined;
};

export function toClassName(classes: CssClasses): string {
	return Object.keys(classes)
		.filter((key) => classes[key])
		.join(" ");
}
