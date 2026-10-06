import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";
import { transformSync } from "esbuild";

// Run the real TypeScript with fake Obsidian/DOM dependencies. Unused imports
// are empty stubs; accessing an unstubbed dependency will fail the test.
function loadModule(path, imports = {}) {
	const source = readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
	const { code } = transformSync(source, { loader: "ts", format: "cjs" });
	const module = { exports: {} };
	runInNewContext(code, {
		module,
		exports: module.exports,
		require: (name) => imports[name] ?? {},
	});
	return module.exports;
}

function createWindow() {
	let nextID = 0;
	const timers = new Map();
	const frames = new Map();
	return {
		timers,
		frames,
		setTimeout(callback, delay) {
			assert.equal(delay, 200);
			timers.set(++nextID, callback);
			return nextID;
		},
		clearTimeout: (id) => timers.delete(id),
		requestAnimationFrame(callback) {
			frames.set(++nextID, callback);
			return nextID;
		},
		cancelAnimationFrame: (id) => frames.delete(id),
		flushTimers() {
			const callbacks = [...timers.values()];
			timers.clear();
			callbacks.forEach((callback) => callback());
		},
		flushFrames() {
			const callbacks = [...frames.values()];
			frames.clear();
			callbacks.forEach((callback) => callback());
		},
	};
}

function rect(left, right, top = 0, bottom = 30) {
	return { left, right, top, bottom, width: right - left, height: bottom - top };
}

function createLeaf(ownerWindow, headerRect = rect(300, 400), containerRect = rect(0, 300)) {
	const operations = [];
	const header = {
		isConnected: true,
		ownerDocument: { defaultView: ownerWindow },
		getBoundingClientRect() {
			operations.push("read header");
			return headerRect;
		},
		scrollIntoView(options) {
			operations.push("scroll");
			assert.equal(options.behavior, "smooth");
			assert.equal(options.block, "nearest");
			assert.equal(options.inline, "nearest");
		},
	};
	const container = {
		isConnected: true,
		getBoundingClientRect() {
			operations.push("read container");
			return containerRect;
		},
	};
	return {
		operations,
		tabHeaderEl: header,
		parent: { isStacked: false, tabHeaderContainerEl: container },
	};
}

function createScroller() {
	const settings = { scrollableTabs: true };
	const { createActiveTabScroller } = loadModule("src/services/ScrollableTabs.ts", {
		obsidian: { debounce: (callback) => callback },
		"src/constants/Timeouts": { REFRESH_TIMEOUT_LONGER: 200 },
		"src/models/PluginContext": { useSettings: { getState: () => settings } },
	});
	return { settings, scroller: createActiveTabScroller() };
}

test("typing does not enqueue active-tab measurements or scrolling", () => {
	const { scroller } = createScroller();
	const ownerWindow = createWindow();
	const leaf = createLeaf(ownerWindow);
	const listeners = new Map();
	const cleanup = [];
	class Plugin {
		register(callback) { cleanup.push(callback); }
		registerEvent() {}
	}
	const { default: VerticalTabs } = loadModule("src/main.ts", {
		obsidian: { Plugin },
		"./services/ScrollableTabs": { createActiveTabScroller: () => scroller },
	});
	const plugin = new VerticalTabs();
	plugin.app = { workspace: { on: (event, callback) => listeners.set(event, callback) } };
	plugin.registerScrollableTabsEvents();
	assert.equal(listeners.has("editor-change"), false);
	for (let edit = 0; edit < 1000; edit++) {
		listeners.get("editor-change")?.({}, { leaf });
	}
	ownerWindow.flushTimers();
	ownerWindow.flushFrames();
	assert.deepEqual(leaf.operations, []);
	assert.equal(ownerWindow.timers.size, 0);
	assert.equal(ownerWindow.frames.size, 0);

	listeners.get("active-leaf-change")(leaf);
	assert.equal(ownerWindow.timers.size, 1);
	cleanup.forEach((callback) => callback());
	ownerWindow.flushTimers();
	ownerWindow.flushFrames();
	assert.deepEqual(leaf.operations, []);
});

test("visible active tabs are measured once per frame without scrolling", () => {
	const { scroller } = createScroller();
	const ownerWindow = createWindow();
	const leaf = createLeaf(ownerWindow, rect(100, 200));
	scroller.scrollToActiveTab(leaf);
	assert.deepEqual(leaf.operations, []);
	ownerWindow.flushTimers();
	assert.deepEqual(leaf.operations, []);
	ownerWindow.flushFrames();
	assert.deepEqual(leaf.operations, ["read header", "read container"]);
});

for (const [edge, bounds] of [
	["left", rect(-20, 80)],
	["right", rect(250, 350)],
	["top", rect(100, 200, -10, 20)],
	["bottom", rect(100, 200, 10, 40)],
]) {
	test(`tabs clipped at the ${edge} edge scroll after the geometry reads`, () => {
		const { scroller } = createScroller();
		const ownerWindow = createWindow();
		const leaf = createLeaf(ownerWindow, bounds);
		scroller.scrollToActiveTab(leaf);
		ownerWindow.flushTimers();
		ownerWindow.flushFrames();
		assert.deepEqual(leaf.operations, ["read header", "read container", "scroll"]);
	});
}

test("rapid activation retains only the latest tab, including across windows", () => {
	const { scroller } = createScroller();
	const firstWindow = createWindow();
	const secondWindow = createWindow();
	const oldLeaf = createLeaf(firstWindow);
	const latestLeaf = createLeaf(secondWindow);
	scroller.scrollToActiveTab(oldLeaf);
	firstWindow.flushTimers();
	assert.equal(firstWindow.frames.size, 1);
	for (let activation = 0; activation < 100; activation++) {
		scroller.scrollToActiveTab(latestLeaf);
	}
	assert.equal(firstWindow.frames.size, 0);
	assert.equal(secondWindow.timers.size, 1);
	firstWindow.flushFrames();
	secondWindow.flushTimers();
	secondWindow.flushFrames();
	assert.deepEqual(oldLeaf.operations, []);
	assert.deepEqual(latestLeaf.operations, ["read header", "read container", "scroll"]);
});

for (const [reason, invalidate] of [
	["disabled scrolling", (leaf, settings) => { settings.scrollableTabs = false; }],
	["stacked group", (leaf) => { leaf.parent.isStacked = true; }],
	["closed leaf", (leaf) => { leaf.parent = null; }],
	["detached header", (leaf) => { leaf.tabHeaderEl.isConnected = false; }],
	["detached container", (leaf) => { leaf.parent.tabHeaderContainerEl.isConnected = false; }],
	["missing container", (leaf) => { leaf.parent.tabHeaderContainerEl = undefined; }],
]) {
	test(`${reason} skips queued geometry and scroll work`, () => {
		const { settings, scroller } = createScroller();
		const ownerWindow = createWindow();
		const leaf = createLeaf(ownerWindow);
		scroller.scrollToActiveTab(leaf);
		ownerWindow.flushTimers();
		invalidate(leaf, settings);
		ownerWindow.flushFrames();
		assert.deepEqual(leaf.operations, []);
	});
}

test("hidden tab strips are not scrolled", () => {
	const { scroller } = createScroller();
	const ownerWindow = createWindow();
	const leaf = createLeaf(ownerWindow, rect(300, 400), rect(0, 0, 0, 0));
	scroller.scrollToActiveTab(leaf);
	ownerWindow.flushTimers();
	ownerWindow.flushFrames();
	assert.deepEqual(leaf.operations, ["read header", "read container"]);
});

test("null activation and disposal cancel timers and animation frames", () => {
	const { scroller } = createScroller();
	const ownerWindow = createWindow();
	const leaf = createLeaf(ownerWindow);
	scroller.scrollToActiveTab(leaf);
	scroller.scrollToActiveTab(null);
	assert.equal(ownerWindow.timers.size, 0);
	scroller.scrollToActiveTab(leaf);
	ownerWindow.flushTimers();
	scroller.cancel();
	scroller.cancel();
	assert.equal(ownerWindow.frames.size, 0);
	ownerWindow.flushFrames();
	assert.deepEqual(leaf.operations, []);
});

test("editing promotes a preview tab once and allows a future preview transition", () => {
	class MarkdownView {
		constructor(leaf) { this.leaf = leaf; }
	}
	const { makeLeafEphemeralOnEditorChange } = loadModule("src/services/EphemeralTabs.ts", {
		obsidian: { MarkdownView },
		"src/constants/Events": { EVENTS: { EPHEMERAL_TOGGLE: "ephemeral-toggle" } },
	});
	for (const initialState of [true, undefined, false]) {
		let writes = 0;
		let events = 0;
		const leaf = {
			isEphemeral: initialState,
			tabHeaderEl: { toggleClass(name, enabled) {
				assert.equal(name, "vt-non-ephemeral");
				assert.equal(enabled, true);
				writes++;
			} },
			trigger(name, enabled) {
				assert.equal(name, "ephemeral-toggle");
				assert.equal(enabled, false);
				events++;
			},
		};
		const info = new MarkdownView(leaf);
		for (let edit = 0; edit < 1000; edit++) makeLeafEphemeralOnEditorChange(info);
		assert.equal(leaf.isEphemeral, false);
		assert.equal(writes, initialState === false ? 0 : 1);
		assert.equal(events, writes);
		leaf.isEphemeral = true;
		makeLeafEphemeralOnEditorChange(info);
		assert.equal(events, initialState === false ? 1 : 2);
		makeLeafEphemeralOnEditorChange({ leaf });
		assert.equal(events, writes);
	}
});
