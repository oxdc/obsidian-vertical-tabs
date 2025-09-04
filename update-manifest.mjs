import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import crypto from "crypto";

function getFileHash(filePath) {
	const content = readFileSync(filePath);
	return crypto.createHash("sha256").update(content).digest("hex");
}

function updateManifest(archiveDir) {
	const manifestPath = `${archiveDir}/manifest.json`;
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
	manifest.isBeta = true;
	manifest.timestamp = new Date().toISOString();
	manifest.files = {};
	const files = readdirSync(archiveDir);
	for (const file of files) {
		if (file === "manifest.json") continue;
		if (file.startsWith(".")) continue; // Skip dot files
		const filePath = `${archiveDir}/${file}`;
		const stat = statSync(filePath);
		if (!stat.isFile()) continue;
		manifest.files[file] = `sha256:${getFileHash(filePath)}`;
	}
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	console.log(`Updated manifest.json in ${archiveDir}`);
	console.log(`Added ${Object.keys(manifest.files).length} file hashes`);
}

const archiveDir = process.argv[2];
if (!archiveDir) {
	console.error(
		"Usage: node customize-manifest.mjs <archive-directory> [timestamp]"
	);
	process.exit(1);
}
updateManifest(archiveDir);
