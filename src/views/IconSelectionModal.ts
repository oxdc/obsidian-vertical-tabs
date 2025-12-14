import {
	App,
	getIconIds,
	Modal,
	setIcon,
	Setting,
	TextComponent,
} from "obsidian";

export class IconSelectionModal extends Modal {
	private onSubmit: (icon: string) => void;
	private onReset: () => void;
	private searchQuery = "";
	private iconIds: string[] = [];

	constructor(
		app: App,
		onSubmit: (icon: string) => void,
		onReset: () => void
	) {
		super(app);
		this.onSubmit = onSubmit;
		this.onReset = onReset;
		this.iconIds = getIconIds().map((id) => id.replace("lucide-", ""));
	}

	onOpen() {
		this.setTitle("Select an icon");
		const { contentEl, containerEl } = this;
		containerEl.addClass("vt-icon-selection-modal");

		const searchContainer = contentEl.createDiv("vt-icon-search-container");
		new TextComponent(searchContainer)
			.setPlaceholder("Search icons...")
			.setValue(this.searchQuery)
			.onChange((value) => {
				this.searchQuery = value.toLowerCase();
				this.renderIcons();
			});

		contentEl.createDiv("vt-icons-container");
		this.renderIcons();

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Reset")
					.setWarning()
					.onClick(() => {
						this.close();
						this.onReset();
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => this.close())
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private parseSearchTerms(query: string): string[] {
		return query
			.split(/\s+/)
			.filter((term) => term.length > 0);
	}

	private calculateRelevanceScore(iconId: string, searchTerms: string[]): number {
		let score = 0;
		for (const term of searchTerms) {
			if (iconId.startsWith(term)) {
				score += 10; // Highest priority for prefix match
			} else if (iconId.includes(term)) {
				score += 5; // Medium priority for substring match
			}
		}
		return score;
	}

	private filterAndSortIcons(): string[] {
		if (!this.searchQuery) {
			return this.iconIds;
		}

		const searchTerms = this.parseSearchTerms(this.searchQuery);
		
		const filteredIcons = this.iconIds.filter((id) => {
			return searchTerms.some((term) => id.includes(term));
		});

		return filteredIcons.sort((a, b) => {
			const scoreA = this.calculateRelevanceScore(a, searchTerms);
			const scoreB = this.calculateRelevanceScore(b, searchTerms);
			return scoreB - scoreA; // Higher score first
		});
	}

	private renderIcons() {
		const container = this.contentEl.querySelector(".vt-icons-container");
		if (!container) return;

		container.empty();

		const filteredIcons = this.filterAndSortIcons();

		if (filteredIcons.length === 0) {
			container.createDiv({
				text: "No icons found",
				cls: "vt-no-icons-message",
			});
			return;
		}

		const grid = container.createDiv("vt-icons-grid");

		filteredIcons.forEach((iconId) => {
			const iconButton = grid.createDiv("vt-icon-item");
			const iconEl = iconButton.createDiv("vt-icon-item-icon");
			setIcon(iconEl, iconId);
			const labelEl = iconButton.createDiv("vt-icon-item-label");
			labelEl.setText(
				iconId
					.replace(/-/g, " ")
					.replace(/\b\w/g, (c) => c.toUpperCase())
			);
			iconButton.addEventListener("click", () => {
				this.close();
				this.onSubmit(iconId);
			});
		});
	}
}
