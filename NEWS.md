# Vertical Tabs v0.17.0-beta

## 🎉 What's New:

- **Scrollable tabs**: Introducing a new, intuitive way to interact with horizontal tabs.
- **Mission Control View, redesigned**: The Mission Control View has been completely redesigned with full feature support and can now be activated with a single click.
- **Multi-selection in vertical tabs**: You can now select multiple tabs simultaneously using Ctrl/Cmd+click for individual selection or Shift+click for range selection (#32).
- **Device-specific disable option**: Added a new setting that allows you to disable Vertical Tabs on specific devices (#177).
- **Mobile workspace split support**: Workspace split view is now available on mobile devices, automatically adjusting to horizontal or vertical splits based on screen orientation.
- **New option: auto-hide horizontal tabs** when the sidebar is open.
- **New menu options**: Added convenient options to open files or move tabs to specific tab groups directly from the context menu.
- **Support for tab deduplication for Bases.**
- **Experimental support for a new, more efficient tab deduplication implementation.**

## 🐛 Bug Fixes:

- Improved tab sorting and organization algorithms.
- Enhanced mobile compatibility with improved touch interactions and responsiveness.
- Addressed various edge cases in tab selection and navigation behavior.
- Resolved infinite loop issue that occurred when patching default commands.
- Cleaned up mobile interface by hiding unavailable debugging tools.

## ✅ Improvements:

- Built-in security feature for beta build integrity verification.
- Optimized performance and user experience for keyboard navigation workflows.
- Improved compatibility with community themes.
- Improved integration with the built-in Search plugin when tab deduplication is enabled.

---

# Vertical Tabs v0.16.4

## 🐛 Bug Fixes:

- **Auto-unhide last remaining group**: Automatically shows the final hidden group when all others are closed (#175).
- **Fixed folded groups visibility**: Resolved issue where folded groups would disappear from view (#176).

## ✅ Improvements:

- Improved settings tab and debugging tools.

---

# Vertical Tabs v0.16.3

## 🎉 What's New:

- **Copy as Wikilinks**: New context menu options to copy individual tabs and entire tab groups as wikilinks `[[note]]` or embed links `![[note]]` (#135).

## 🐛 Bug Fixes:

- Fixed window dragging issue when the upper group is hidden. Users can now properly drag the Obsidian window by the tab container area (#174).
- Resolved tab list refresh problems in Obsidian 1.9+.
- Fixed issue where tabs could not be dragged to the end of tab groups.

## ✅ Improvements:

- Added debugging tools to the settings tab to assist with troubleshooting.
- Code structure improvements and cleanup.

---

# Vertical Tabs v0.16.2

## 🎉 What's New:

- **Improved UI & UX**: The old "new tab" button has been replaced with a plus icon in the group toolbar. Creating new tabs no longer causes annoying content shifts (Credit: @DovieW) (#173).

## 🐛 Bug Fixes:

- Resolved a critical issue where folded groups would become invisible in the UI.
- Performance improvements.

---

# Vertical Tabs v0.16.1

## 🎉 What's New:

- **Power Drag**: Press the Alt/Option key (don't hold it; release immediately!) to enable advanced drag operations on tabs. Drag the tab title to rearrange the workspace layout. Drag the tab handle to insert file links directly into the editor or move the open file to another folder. Visually activated with a grip icon after the Alt key is pressed.
- **Sort Tabs by Creation Date**: Added new sorting options to organize tabs by file creation time, with oldest-first and newest-first options available (#165).

## 🐛 Bug Fixes:

- Fixed "Reveal current file in file navigation" and "Files: show file explorer" commands not moving focus to the sidebar (#164)
- Resolved conflict with Excalidraw Plugin where canvas content wasn't displaying properly when inserted into drawings (#166)
- Corrected navigation button functionality issues (#171)
- Fixed tab deduplication edge cases (#172, #163)

## ✅ Improvements:

- Updated build tools and development dependencies (security fix)
- Code structure cleanup for better maintainability

---

# Vertical Tabs v0.16.0

## 🎉 What's New:

- **Webview Icons**: Website favicons now appear on webview tabs, enhancing visual recognition when browsing the web within Obsidian. (Credit: @AlanJs26)
- **Enhanced Mission Control View**: Added customization options for zoom factor and pointer interactions, featuring a new responsive layout that adapts elegantly to various screen sizes. (Credit: @PandaNocturne)

## 🐛 Bug Fixes:

- Corrected ephemeral tab history handling issues (#160)
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
