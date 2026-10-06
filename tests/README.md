Run `npm ci`, then `npm test` for the typing and active-tab scrolling regressions.
The tests run the TypeScript source with fake Obsidian events, DOM rectangles,
timers, and animation frames; they check work counts, not browser frame times.

To verify performance in Obsidian:

1. Enable scrollable tabs and preview (ephemeral) tabs, and open enough notes to
   overflow a tab strip.
2. Record a Chrome DevTools Performance trace while typing continuously for
   roughly 18 seconds. The first edit should make a preview tab permanent;
   subsequent edits should not scroll or update its preview state again.
3. Switch to a visible tab, then an offscreen tab. Only the offscreen tab should
   scroll into view. Rapidly switch tabs and check that only the last activation
   produces a delayed scroll.
4. Repeat with stacked tabs, a hidden horizontal tab strip, and a popout window.
   Disable the plugin while a scroll is pending and check that it is cancelled.

Compare callback counts, layout time, and tasks over 16.7 ms against the original
trace under the same settings and workspace. Automated tests cannot establish
the resulting frame times in a live Obsidian workspace.
