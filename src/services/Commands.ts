import { App, Command } from "obsidian";

export type CommandCheckCallback = (checking: boolean) => boolean | void;
export type CommandCallback = () => unknown;

export function getCommandByName(app: App, name: string): Command | undefined {
	return app.commands.commands[name];
}
