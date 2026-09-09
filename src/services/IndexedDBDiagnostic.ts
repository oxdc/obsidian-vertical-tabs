import { App, Platform } from "obsidian";
import { DB_STORE_NAMES, getDBName } from "src/stores/TabMetadataDB";

type DiagnosticLog = (...args: unknown[]) => void;

export async function runIndexedDBDiagnostic(
	app: App,
	log: DiagnosticLog
): Promise<void> {
	const dbName = getDBName(app);
	const expectedStores = [...DB_STORE_NAMES];

	let ui = "unknown";
	if (Platform.isMobile) ui = "mobile";
	else if (Platform.isDesktop) ui = "desktop";

	let appRuntime = "unknown";
	if (Platform.isIosApp) appRuntime = "iOS";
	else if (Platform.isAndroidApp) appRuntime = "Android";
	else if (Platform.isDesktopApp) appRuntime = "electron";
	else if (Platform.isMobileApp) appRuntime = "Capacitor";

	let form: string | null = null;
	if (Platform.isPhone) form = "phone";
	else if (Platform.isTablet) form = "tablet";

	let os = "unknown";
	if (Platform.isMacOS) os = "macOS";
	else if (Platform.isWin) os = "Windows";
	else if (Platform.isLinux) os = "Linux";

	log("=== VerticalTabs IndexedDB Diagnostic ===");
	log("Timestamp:", new Date().toISOString());
	log(
		"Platform:",
		`UI=${ui}  App=${appRuntime}${
			form ? `  form=${form}` : ""
		}  OS=${os}  Safari=${Platform.isSafari ? "yes" : "no"}`
	);

	try {
		const est = await navigator.storage.estimate();
		const quota = est.quota ?? 0;
		const usage = est.usage ?? 0;
		log(
			`\n[Storage] quota: ${(quota / 1e6).toFixed(1)} MB, usage: ${(
				usage / 1e6
			).toFixed(2)} MB`
		);
	} catch (e) {
		log("[Storage] estimate() failed:", (e as Error).message);
	}

	try {
		const dbs = await indexedDB.databases();
		const vtDbs = dbs.filter((d) =>
			d.name?.startsWith("VerticalTabsMetadata-")
		);
		log(
			`\n[IDB Databases] ${dbs.length} found, listing ${vtDbs.length} Vertical Tabs databases:`
		);
		vtDbs.forEach((d) => log(`  name="${d.name}" version=${d.version}`));
		if (!vtDbs.some((d) => d.name === dbName))
			log(`  !! "${dbName}" does NOT exist yet`);
	} catch (e) {
		log(
			"[IDB Databases] indexedDB.databases() failed:",
			(e as Error).message
		);
	}

	log(`\n[Probe] Opening "${dbName}" without version...`);
	await new Promise<void>((resolve) => {
		const req = indexedDB.open(dbName);

		req.onupgradeneeded = (e) => {
			log(
				`[Probe] onupgradeneeded fired — oldVersion=${e.oldVersion}, newVersion=${e.newVersion}`
			);
			log(
				"  => DB did not exist or was at version 0. Read-only probe — not modifying database."
			);
			req.transaction?.abort();
		};

		req.onblocked = (e) => {
			log(
				`[Probe] BLOCKED — another connection is preventing open (oldVersion=${e.oldVersion})`
			);
		};

		req.onerror = () => {
			log("[Probe] ERROR:", req.error?.message);
			resolve();
		};

		req.onsuccess = () => {
			const db = req.result;
			const storeNames = Array.from(db.objectStoreNames);
			log(
				`[Probe] onsuccess — version=${db.version}, stores=[${
					storeNames.join(", ") || "(none)"
				}]`
			);

			for (const s of expectedStores) {
				if (!storeNames.includes(s)) {
					log(`  !! MISSING store: "${s}"`);
				} else {
					log(`  store exists: "${s}"`);
				}
			}

			log("\n[Transactions] Attempting read transactions...");
			let pending = expectedStores.length;
			for (const s of expectedStores) {
				if (!storeNames.includes(s)) {
					log(`  [${s}] skipped (store missing)`);
					if (--pending === 0) {
						db.close();
						resolve();
					}
					continue;
				}
				try {
					const tx = db.transaction([s], "readonly");
					const store = tx.objectStore(s);
					const countReq = store.count();
					countReq.onsuccess = () => {
						log(
							`  [${s}] count=${countReq.result} — transaction OK`
						);
						if (--pending === 0) {
							db.close();
							resolve();
						}
					};
					countReq.onerror = () => {
						log(
							`  [${s}] count request error:`,
							countReq.error?.message
						);
						if (--pending === 0) {
							db.close();
							resolve();
						}
					};
					tx.onerror = () => {
						log(`  [${s}] transaction error:`, tx.error?.message);
						if (--pending === 0) {
							db.close();
							resolve();
						}
					};
				} catch (e) {
					const err = e as Error;
					log(
						`  [${s}] transaction threw: ${err.name}: ${err.message}`
					);
					if (--pending === 0) {
						db.close();
						resolve();
					}
				}
			}
			if (expectedStores.length === 0) {
				db.close();
				resolve();
			}
		};
	});

	log("\n[Concurrency] Simulating 3 simultaneous open calls...");
	const concurrentResults = await Promise.allSettled(
		[0, 1, 2].map(
			(i) =>
				new Promise<string>((resolve, reject) => {
					const r = indexedDB.open(dbName);
					r.onupgradeneeded = (e) => {
						r.transaction?.abort();
						resolve(
							`[${i}] onupgradeneeded fired (oldV=${e.oldVersion}→newV=${e.newVersion}) — aborted (read-only)`
						);
					};
					r.onsuccess = () => {
						const db = r.result;
						const stores = Array.from(db.objectStoreNames);
						const msg = `[${i}] onsuccess v=${
							db.version
						} stores=[${stores.join(",")}]`;
						db.close();
						resolve(msg);
					};
					r.onerror = () =>
						reject(new Error(`[${i}] error: ${r.error?.message}`));
					r.onblocked = () => resolve(`[${i}] BLOCKED`);
				})
		)
	);
	concurrentResults.forEach((r) =>
		log(
			" ",
			r.status === "fulfilled"
				? r.value
				: "REJECTED: " + (r.reason as Error)?.message
		)
	);

	log("\n=== Diagnostic complete ===");
}
