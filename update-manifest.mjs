import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import crypto from "crypto";

function getFileHash(filePath) {
	const content = readFileSync(filePath);
	return crypto.createHash("sha256").update(content).digest("hex");
}

function deepSortKeys(obj) {
	if (obj === null || typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map(deepSortKeys);
	const sortedKeys = Object.keys(obj).sort();
	const sortedObj = {};
	for (const key of sortedKeys) sortedObj[key] = deepSortKeys(obj[key]);
	return sortedObj;
}

function signManifest(manifestPath, privateKeyPath) {
	if (!privateKeyPath) {
		console.log("No private key provided, skipping signature generation");
		return;
	}
	try {
		const privateKeyPem = readFileSync(privateKeyPath, "utf8");
		const manifestContent = readFileSync(manifestPath, "utf8");
		const manifest = JSON.parse(manifestContent);

		// Extract public key from private key and add to manifest
		const privateKey = crypto.createPrivateKey(privateKeyPem);
		const publicKey = crypto.createPublicKey(privateKey);
		const publicKeyDer = publicKey.export({ type: "spki", format: "der" });
		const publicKeyBase64 = publicKeyDer.toString("base64");
		manifest.publicKey = publicKeyBase64;

		// Create canonical JSON
		delete manifest.signature;
		const sortedManifest = deepSortKeys(manifest);
		const canonicalJson = JSON.stringify(sortedManifest);

		// Generate signature
		const signature = crypto
			.sign(null, Buffer.from(canonicalJson, "utf8"), privateKey)
			.toString("hex");
		manifest.signature = signature;

		writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
		const sigPath = `${manifestPath}.sig`;
		writeFileSync(sigPath, signature);
		console.log(`Generated Ed25519 signature: ${sigPath}`);
		console.log(`Signature: ${signature}`);
		console.log(`Embedded public key and signature in manifest.json`);
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
