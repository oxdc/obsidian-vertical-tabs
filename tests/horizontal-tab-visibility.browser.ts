import type { App } from "obsidian";
import {
	clearHorizontalTabVisibility,
	observeHorizontalTabVisibility,
	refreshHorizontalTabVisibility,
} from "../src/services/HorizontalTabVisibility";

const results: string[] = [];

function element(classes: string, parent: HTMLElement) {
	const child = document.createElement("div");
	child.className = classes;
	parent.appendChild(child);
	return child;
}

function sidebar(side: "left" | "right", workspace: HTMLElement) {
	const split = element(`mod-sidedock mod-${side}-split`, workspace);
	const tabs = element("workspace-tabs", split);
	const bar = element("workspace-tab-header-container", tabs);
	const headers = element("workspace-tab-header-container-inner", bar);
	const vt = element("workspace-tab-header is-active obsidian-vertical-tabs-tab-header", headers);
	const other = element("workspace-tab-header", headers);
	return { split, vt, other };
}

function assert(condition: boolean, message: string) {
	if (!condition) throw new Error(message);
}

function fixture() {
	document.body.className = "vt-auto-hide-horizontal-tabs";
	const workspace = element("workspace", document.body);
	const left = sidebar("left", workspace);
	const root = element("workspace-split mod-root", workspace);
	const group = element("workspace-tabs vt-mod-top-space vt-mod-top-left-space vt-mod-top-right-main", root);
	const bar = element("workspace-tab-header-container", group);
	const header = element("view-header", group);
	const buttons = element("vt-header-buttons", header);
	const leftToggle = element("vt-extra-left-sidebar-toggle", header);
	const rightToggle = element("vt-extra-sidebar-toggle", header);
	const right = sidebar("right", workspace);
	right.vt.classList.remove("is-active");
	const popout = element("workspace", document.body);
	const popoutRoot = element("workspace-split mod-root", popout);
	const popoutGroup = element("workspace-tabs", popoutRoot);
	const popoutBar = element("workspace-tab-header-container", popoutGroup);
	const app = { workspace: { containerEl: workspace } } as unknown as App;
	const refresh = (enabled = true) => refreshHorizontalTabVisibility(app, enabled);
	const hidden = () => getComputedStyle(bar).display === "none";
	return { workspace, left, right, root, group, bar, header, buttons, leftToggle,
		rightToggle, popout, popoutBar, app, refresh, hidden,
		remove: () => { workspace.remove(); popout.remove(); } };
}

function test(name: string, run: (f: ReturnType<typeof fixture>) => void) {
	const f = fixture();
	try { run(f); results.push(`PASS ${name}`); }
	finally { f.remove(); }
}

test("left sidebar hides the root tab bar and shows replacement controls", f => {
	f.refresh();
	assert(f.hidden(), "Root tabs must be hidden");
	assert(getComputedStyle(f.buttons).display === "flex", "Replacement controls must be visible");
	assert(getComputedStyle(f.leftToggle).display === "flex", "Left toggle must remain accessible");
	assert(getComputedStyle(f.rightToggle).display === "flex", "Right toggle must remain accessible");
	assert(getComputedStyle(f.popoutBar).display !== "none", "Main sidebar must not hide popout tabs");
});

test("switching sidebar tabs updates visibility without changing the active editor", f => {
	f.refresh();
	f.left.vt.classList.remove("is-active");
	f.left.other.classList.add("is-active");
	f.refresh();
	assert(!f.hidden(), "A non-VT sidebar tab must show horizontal tabs");
	f.left.vt.classList.add("is-active");
	f.refresh();
	assert(f.hidden(), "Switching back to VT must hide horizontal tabs");
});

test("collapsed sidebars do not hide tabs", f => {
	f.left.split.classList.add("is-sidedock-collapsed");
	f.refresh();
	assert(!f.hidden(), "Collapsed left sidebar must not hide horizontal tabs");
	f.right.vt.classList.add("is-active");
	f.right.split.classList.add("is-sidedock-collapsed");
	f.refresh();
	assert(!f.hidden(), "Collapsed right sidebar must not hide horizontal tabs");
});

test("right sidebar retains the frameless left-window-control space", f => {
	document.body.classList.add("is-hidden-frameless");
	f.left.vt.classList.remove("is-active");
	f.right.vt.classList.add("is-active");
	f.refresh();
	assert(f.hidden(), "Right-side VT must hide horizontal tabs");
	assert(getComputedStyle(f.header).paddingLeft === "48px", "Frameless window controls need left space");
	f.right.vt.classList.remove("is-active");
	f.refresh();
	assert(!f.workspace.classList.contains("vt-horizontal-tabs-right-sidebar"), "Right-side state must clear");
});

for (const side of ["left", "right"] as const) {
	test(`pinned ${side} drawer hides tabs only while open and active`, f => {
		f.left.vt.classList.remove("is-active");
		const drawer = element(`workspace-drawer is-pinned mod-${side}`, f.workspace);
		const options = element("workspace-drawer-tab-options-list", drawer);
		const vt = element("workspace-tab-header is-active obsidian-vertical-tabs-tab-header", options);
		f.refresh();
		assert(!f.hidden(), "Closed drawer must not hide tabs");
		f.workspace.classList.add(`is-${side}-sidedock-open`);
		f.refresh();
		assert(f.hidden(), "Open pinned VT drawer must hide tabs");
		drawer.classList.remove("is-pinned");
		f.refresh();
		assert(!f.hidden(), "Unpinned drawer must not hide tabs");
		drawer.classList.add("is-pinned");
		vt.classList.remove("is-active");
		f.refresh();
		assert(!f.hidden(), "Inactive VT drawer must not hide tabs");
	});
}

test("VT in the root split does not count as a sidebar", f => {
	f.left.vt.classList.remove("is-active");
	element("workspace-tab-header is-active obsidian-vertical-tabs-tab-header", f.group);
	f.refresh();
	assert(!f.hidden(), "A VT editor tab must not hide horizontal tabs");
});

test("turning the feature off clears both workspace flags", f => {
	f.right.vt.classList.add("is-active");
	f.refresh();
	f.refresh(false);
	assert(!f.hidden(), "Disabled feature must show horizontal tabs");
	assert(!f.workspace.classList.contains("vt-horizontal-tabs-right-sidebar"), "Disabled feature must clear right state");
});

test("unchanged workspace state does not mutate classes", f => {
	f.refresh();
	const observer = new MutationObserver(() => {});
	observer.observe(f.workspace, { attributes: true });
	for (let i = 0; i < 20; i++) f.refresh();
	assert(observer.takeRecords().length === 0, "No-op refreshes must not invalidate workspace styles");
	observer.disconnect();
});

test("unload cleanup restores normal visibility", f => {
	f.refresh();
	clearHorizontalTabVisibility(f.app);
	assert(!f.hidden(), "Cleanup must restore horizontal tabs");
});

async function testSidebarObservation() {
	const f = fixture();
	let refreshes = 0;
	const observer = observeHorizontalTabVisibility(f.app, () => {
		refreshes++;
		f.refresh();
	});
	const settle = () => new Promise(resolve => window.setTimeout(resolve, 0));
	try {
		f.refresh();
		await settle();
		f.left.split.classList.add("is-sidedock-collapsed");
		await settle();
		assert(!f.hidden(), "Observer must react to collapse before resize/animation events");
		f.left.split.classList.remove("is-sidedock-collapsed");
		await settle();
		assert(f.hidden(), "Observer must react to expand");
		f.left.vt.classList.remove("is-active");
		await settle();
		assert(!f.hidden(), "Observer must react to sidebar tab changes");
		results.push("PASS sidebar class changes refresh visibility without workspace events");

		const before = refreshes;
		const outline = element("workspace-leaf-content", f.right.split);
		for (let i = 0; i < 20; i++) {
			const heading = element("tree-item-self", outline);
			heading.classList.add("is-being-dragged-over");
			heading.remove();
		}
		await settle();
		assert(refreshes === before, "Outline mutations must not invoke the sidebar observer");
		results.push("PASS Outline drag-marker mutations do not invoke the observer");
		observer.disconnect();
		f.left.vt.classList.add("is-active");
		await settle();
		assert(refreshes === before, "Disconnected observer must stop refreshing");
		results.push("PASS observer disconnect removes mutation-driven work");
	} finally { observer.disconnect(); f.remove(); }
}

void testSidebarObservation().then(() => {
	document.body.className = "";
	const output = document.createElement("pre");
	output.textContent = results.join("\n");
	document.body.appendChild(output);
	Object.assign(window, { horizontalTabTestResults: results });
});
