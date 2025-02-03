export function parseLink(linkText: string) {
	const hashIndex = linkText.indexOf("#");
	const hasHash = hashIndex !== -1;
	const path = hasHash ? linkText.substring(0, hashIndex) : linkText;
	const subpath = hasHash ? linkText.substring(hashIndex) : "";
	return { path, subpath };
}
