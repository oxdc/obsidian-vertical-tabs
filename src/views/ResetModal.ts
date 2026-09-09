import { App, Modal, Notice, Setting, setIcon } from "obsidian";
import ObsidianVerticalTabs from "../main";
import { DEFAULT_SETTINGS } from "../models/PluginSettings";
import { STORAGE_KEYS } from "../constants/StorageKeys";
import { localStorageService } from "../stores/LocalStorageService";
import { resetDatabase } from "../stores/IndexedDBWrapper";
import { getDBName, DB_STORE_NAMES } from "../stores/TabMetadataDB";

type ResetScope = "settings" | "db" | "all";

interface ResetOption {
	label: string;
	erases: string[];
	keeps: string | null;
}

const RESET_OPTIONS: Record<ResetScope, ResetOption> = {
	settings: {
		label: "Reset plugin settings",
		erases: [
			"All feature preferences",
			"Navigation and tab deduplication settings",
			"Custom sort order and sort strategy",
		],
		keeps: "All custom titles, colors, and icons for groups and tabs will be kept.",
	},
	db: {
		label: "Reset customization",
		erases: [
			"Custom titles, colors, and icons for groups and tabs",
		],
		keeps: "All plugin settings and preferences will be kept.",
	},
	all: {
		label: "Reset everything",
		erases: [
			"Custom titles, colors, and icons for all groups and tabs",
			"All plugin settings and feature preferences",
			"Custom sort order and strategy",
		],
		keeps: null,
	},
};

const SCOPE_ORDER: ResetScope[] = ["settings", "db", "all"];

export class ResetModal extends Modal {
	private plugin: ObsidianVerticalTabs;
	private selected: ResetScope = "settings";
	private detailEl!: HTMLElement;

	constructor(app: App, plugin: ObsidianVerticalTabs) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { titleEl, contentEl } = this;
		titleEl.setText("Reset Vertical Tabs");
		contentEl.addClass("vt-reset-modal", "vertical-tab-settings");

		new Setting(contentEl)
			.setName("Reset scope")
			.setDesc(
				"Choose what to reset. Vertical Tabs will reload automatically afterward."
			)
			.addDropdown((dropdown) => {
				for (const scope of SCOPE_ORDER) {
					dropdown.addOption(scope, RESET_OPTIONS[scope].label);
				}
				dropdown.setValue(this.selected).onChange((value) => {
					this.selected = value as ResetScope;
					this.renderDetail();
				});
			});

		this.detailEl = contentEl.createDiv({
			cls: "vt-reset-detail mod-warning",
		});
		this.renderDetail();

		new Setting(contentEl)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close())
			)
			.addButton((btn) =>
				btn
					.setButtonText("Reset")
					.setClass("mod-destructive")
					.setCta()
					.onClick(() => void this.performReset())
			);
	}

	onClose() {
		this.contentEl.empty();
	}

	private renderDetail() {
		const el = this.detailEl;
		el.empty();
		const option = RESET_OPTIONS[this.selected];

		el.createDiv({
			text: `Selected: ${option.label}`,
			cls: "vt-reset-selected",
		});

		const erasesHeader = el.createEl("p", { cls: "vt-reset-detail-header" });
		const iconEl = erasesHeader.createSpan();
		setIcon(iconEl, "trash-2");
		erasesHeader.createSpan({ text: " The following will be erased:" });

		const list = el.createEl("ul", { cls: "vt-reset-detail-list" });
		for (const item of option.erases) {
			list.createEl("li", { text: item });
		}

		if (option.keeps) {
			const keepsEl = el.createEl("p", { cls: "vt-reset-detail-keeps" });
			const iconEl2 = keepsEl.createSpan();
			setIcon(iconEl2, "shield-check");
			keepsEl.createSpan({ text: " " + option.keeps });
		}

		const warningEl = el.createEl("p", { cls: "vt-reset-warning" });
		const warnIconEl = warningEl.createSpan();
		setIcon(warnIconEl, "triangle-alert");
		warningEl.createSpan({
			text: " This action is destructive and cannot be undone.",
		});
	}

	private async performReset() {
		const { selected, plugin } = this;
		this.close();
		try {
			if (selected === "db" || selected === "all") {
				try {
					await plugin.app.plugins.disablePlugin(plugin.manifest.id);
				} catch {
					// continue even if disable fails
				}
				await resetDatabase(getDBName(plugin.app), [...DB_STORE_NAMES]);
			}
			if (selected === "settings" || selected === "all") {
				plugin.settings = { ...DEFAULT_SETTINGS };
				await plugin.saveSettings();
				localStorageService.remove(STORAGE_KEYS.SORT_STRATEGY);
				localStorageService.remove(STORAGE_KEYS.GROUP_ORDER);
			}
			new Notice("Vertical Tabs has been reset. Reloading...");
			await plugin.app.plugins.enablePlugin(plugin.manifest.id);
		} catch (e) {
			console.error("[VerticalTabs] Reset failed:", e);
			new Notice(
				"Reset failed: " +
					(e instanceof Error ? e.message : String(e))
			);
		}
	}
}
