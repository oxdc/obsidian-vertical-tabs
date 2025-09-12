import { App, Modal, Setting } from "obsidian";
import { DEFAULT_GROUP_TITLE } from "src/models/ViewState";

export class GroupNameModal extends Modal {
	private groupName = "";
	private onSubmit: (name: string) => void;

	constructor(app: App, onSubmit: (name: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		new Setting(contentEl).setName("Group name").addText((text) =>
			text
				.setPlaceholder(DEFAULT_GROUP_TITLE)
				.setValue(this.groupName)
				.onChange((value) => (this.groupName = value))
		);

		new Setting(contentEl)
			.addButton((button) =>
				button
					.setButtonText("Confirm")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(
							this.groupName.trim() || DEFAULT_GROUP_TITLE
						);
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				})
			);
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
