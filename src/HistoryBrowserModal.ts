import { App, setIcon, SuggestModal, WorkspaceLeaf } from "obsidian";
import { DeduplicatedTitle } from "./services/DeduplicateTitle";

interface HistoryItem {
	title: string;
	offset: number;
}

export class HistoryBrowserModal extends SuggestModal<HistoryItem> {
	leaf: WorkspaceLeaf;
	items: HistoryItem[];

	constructor(app: App, leaf: WorkspaceLeaf) {
		super(app);
		this.leaf = leaf;
		this.items = [];
		this.buildItems();
	}

	buildItems() {
		this.items = [];
		const { backHistory, forwardHistory } = this.leaf.history;
		const { length } = backHistory;
		backHistory.forEach((state, index) => {
			this.items.push({ title: state.title, offset: index - length });
		});
		this.items.push({
			title: DeduplicatedTitle(this.app, this.leaf),
			offset: 0,
		});
		forwardHistory
			.slice()
			.reverse()
			.forEach((state, index) => {
				this.items.push({ title: state.title, offset: index + 1 });
			});
	}

	onOpen(): void {
		super.onOpen();
		this.chooser.setSelectedItem(this.leaf.history.backHistory.length);
	}

	getSuggestions(query: string): HistoryItem[] {
		return this.items.filter((item) =>
			item.title.toLowerCase().includes(query.toLowerCase())
		);
	}

	renderSuggestion(item: HistoryItem, el: HTMLElement): void {
		const innerEl = el.createEl("div", { cls: "vt-suggestion-content" });
		const iconEl = innerEl.createEl("div", { cls: "suggestion-icon" });
		const titleEl = innerEl.createEl("div", {
			cls: "suggestion-title",
			text: item.title,
		});
		if (item.offset === 0) {
			titleEl.style.fontWeight = "bold";
			setIcon(iconEl, "check");
		}
	}

	onChooseSuggestion(
		item: HistoryItem,
		evt: MouseEvent | KeyboardEvent
	): void {
		if (item.offset !== 0) {
			this.leaf.history.go(item.offset);
		}
	}
}
