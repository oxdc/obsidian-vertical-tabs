# Vertical Tabs v0.16.0

## 🎉 What's New:

- **Webview Icons**: Website favicons now appear on webview tabs, enhancing visual recognition when browsing the web within Obsidian. (Credit: @AlanJs26)
- **Enhanced Mission Control View**: Added customization options for zoom factor and pointer interactions, featuring a new responsive layout that adapts elegantly to various screen sizes.

## 🐛 Bug Fixes:

- Corrected ephemeral tab history handling issues (#160) Credit: @PandaNocturne
- Eliminated conflicts between Enhanced Keyboard Tab Switcher and built-in hotkeys (#138)
- Properly disabled per-tab zooming commands when the feature is turned off (#144)
- Resolved the issue where Vertical Tabs icon would disappear after restarting Obsidian (#158)

---

# Vertical Tabs v0.15.2

## 🎉 What's New:

This update introduces a new data persistence layer, addressing issues for users with multiple vaults. During the graceful data migration period, Vertical Tabs remains compatible if you downgrade from v0.15.2 to v0.15.1 or earlier.

---

# Vertical Tabs v0.15.1

## 🎉 What's New:

- **New Icon**: Fresh new look for Vertical Tabs!
- **Improved Algorithm**: Refined "Notebook" and "Explorer" navigation strategies.
- **Enhanced Keyboard Tab Switching**: Tab numbers now appear in horizontal tabs.
- **Smoother Experience**: "Open Vertical Tabs" command no longer triggers animation.

---

# Vertical Tabs v0.15.0

## 🎉 What's New: Group View & Linked Folder

Introducing **Group View**, a powerful new way to organize and navigate your tabs with three distinct modes:

- **Continuous View:** Scroll seamlessly across multiple tabs as if they were sections of a single long note.
- **Column View:** Arrange tabs side by side with horizontal scrolling for easy comparison.
- **Mission Control View:** Get an overview of all tabs in a group and quickly locate the note you need. *(Double-click or press ESC to exit.)*

With **Linked Folder**, you can instantly open a folder as a tab group—recursively or not. This is especially useful when combined with **Continuous View**. For example, open your **Daily Notes** folder as a group and edit multiple notes in a continuous scroll. Customize the number of notes loaded at a time and their loading order to suit your workflow.


## ✅ Improvements:

- **Smarter Tab Deduplication:** Vertical Tabs now estimates tab creation time, significantly improving deduplication accuracy.

- **Better Internal Link Navigation:** When clicking internal links, navigation now jumps directly to specific sections or headings after tab deduplication.

- **More Precise Deduplication Scope:** Now limited to notes, canvases, PDFs, images, and videos, preventing conflicts with other plugins.
- **Customizing Zen Mode:** Added an option that allows users to decide whether to automatically enable "Show active tabs only" when turning on "Zen Mode."
- **Hover Editor Compatibility:** Hover Editor tabs are now hidden to ensure full compatibility.
- **Smart Composer Compatibility:** Vertical Tabs now works seamlessly with Smart Composer.

## 🐛 Bug Fixes:

- Fixed the "missing field" error in the Dev Console when using the "IDE mode".
- Prevented pinned tabs from being deduplicated.
- Resolved an issue where toggling "Zen Mode" would override the "Show active tabs only" setting.
- Fixed a bug where the "Column View Tab Width" setting was not preserved after restarting Obsidian.
