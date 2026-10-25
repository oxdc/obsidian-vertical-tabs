import obsidianmd from "eslint-plugin-obsidianmd";
import globals from "globals";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig(
	globalIgnores([
		"node_modules",
		"dist",
		"esbuild.config.mjs",
		"tests/build-horizontal-tab-visibility.mjs",
		"mangle.mjs",
		"update-manifest.mjs",
		"version-bump.mjs",
		"version-beta-bump.mjs",
		"versions.json",
		"main.js",
		"package.json",
		"package-lock.json",
		"tsconfig.json",
		"references",
		"eslint.config.mts",
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ["manifest.json"],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: [".json"],
			},
		},
	},
	...obsidianmd.configs.recommended,
	{
		files: ["tests/**/*.browser.ts"],
		rules: {
			// Standalone browser fixtures do not have Obsidian's DOM extensions.
			"obsidianmd/prefer-create-el": "off",
		},
	},
	{
		rules: {
			"obsidianmd/ui/sentence-case": "off",
		},
	}
);
