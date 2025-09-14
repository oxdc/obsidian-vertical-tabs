import { App, Modal, Setting, TextComponent } from "obsidian";
import { DEFAULT_GROUP_TITLE } from "src/models/ViewState";

export class GroupNameModal extends Modal {
	private groupName = "";
	private onSubmit: (name: string) => void;

	constructor(app: App, onSubmit: (name: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { titleEl, contentEl, containerEl } = this;
		containerEl.addClass("vt-group-name-modal");
		titleEl.setText("Create new tab group");

		new TextComponent(contentEl)
			.setPlaceholder(DEFAULT_GROUP_TITLE)
			.setValue(this.groupName)
			.onChange((value) => (this.groupName = value))
			.inputEl.addEventListener("keydown", (event) => {
				if (event.isComposing || event.key === "Enter") {
					this.confirm();
				}
			});

		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText("Confirm")
					.setCta()
					.onClick(this.confirm.bind(this))
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(this.dismiss.bind(this))
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private confirm() {
		this.close();
		this.onSubmit(this.groupName.trim() || DEFAULT_GROUP_TITLE);
	}

	private dismiss() {
		this.close();
	}
}
