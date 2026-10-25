import { build } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const outdir = await mkdtemp(join(tmpdir(), "vertical-tabs-visibility-tests-"));
await build({
	entryPoints: ["tests/horizontal-tab-visibility.browser.ts", "src/styles/AutoHideHorizontalTabs.scss"],
	bundle: true,
	outdir,
	plugins: [sassPlugin()],
});
const css = await readFile(join(outdir, "src/styles/AutoHideHorizontalTabs.css"), "utf8");
if (css.includes(":has(")) throw new Error("Auto-hide CSS must not track sidebar descendants with :has()");
await writeFile(join(outdir, "index.html"), `<!doctype html>
<meta charset="utf-8">
<title>Horizontal tab visibility regression tests</title>
<style>:root { --size-4-2:8px; --frame-left-space:40px; }
.workspace-tab-header-container { display:flex; }
.vt-header-buttons { display:none; }
</style>
<link rel="stylesheet" href="src/styles/AutoHideHorizontalTabs.css">
<body><script src="tests/horizontal-tab-visibility.browser.js"></script></body>`);
console.log(`Open in a browser: ${join(outdir, "index.html")}`);
