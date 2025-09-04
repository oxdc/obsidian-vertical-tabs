import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import crypto from "crypto";

function getFileHash(filePath) {
	const content = readFileSync(filePath);
	return crypto.createHash("sha256").update(content).digest("hex");
}

function signManifest(manifestPath, privateKeyPath) {
	if (!privateKeyPath) {
		console.log("No private key provided, skipping signature generation");
		return;
	}
	try {
		const privateKeyPem = readFileSync(privateKeyPath, "utf8");
		const manifestContent = readFileSync(manifestPath, "utf8");
		const privateKey = crypto.createPrivateKey(privateKeyPem);
		const signature = crypto
			.sign(null, Buffer.from(manifestContent, "utf8"), privateKey)
			.toString("hex");
		const sigPath = `${manifestPath}.sig`;
		writeFileSync(sigPath, signature);
		console.log(`Generated Ed25519 signature: ${sigPath}`);
		console.log(`Signature: ${signature}`);
	} catch (error) {
		console.error(`Error signing manifest: ${error.message}`);
		process.exit(1);
	}
}

function updateManifest(archiveDir, privateKeyPath) {
	const manifestPath = `${archiveDir}/manifest.json`;
	const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
	manifest.isBeta = true;
	manifest.timestamp = new Date().toISOString();
	manifest.files = {};
	const files = readdirSync(archiveDir);
	for (const file of files) {
		if (file === "manifest.json") continue;
		if (file.startsWith(".")) continue; // Skip dot files
		if (file.endsWith(".sig")) continue; // Skip signature files
		const filePath = `${archiveDir}/${file}`;
		const stat = statSync(filePath);
		if (!stat.isFile()) continue;
		manifest.files[file] = `sha256:${getFileHash(filePath)}`;
	}
	writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
	console.log(`Updated manifest.json in ${archiveDir}`);
	console.log(`Added ${Object.keys(manifest.files).length} file hashes`);
	signManifest(manifestPath, privateKeyPath);
}

const archiveDir = process.argv[2];
const privateKeyPath = process.argv[3];

if (!archiveDir) {
	console.error(
		"Usage: node update-manifest.mjs <archive-directory> [private-key-path]"
	);
	process.exit(1);
}

updateManifest(archiveDir, privateKeyPath);
