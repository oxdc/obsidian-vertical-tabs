import { App, normalizePath } from "obsidian";
import ObsidianVerticalTabs from "src/main";

const EMBEDDED_PUBLIC_KEY = process.env.EMBEDDED_PUBLIC_KEY;

async function getFileHash(app: App, filePath: string): Promise<string> {
	const fileContent = await app.vault.adapter.readBinary(filePath);
	const hashBuffer = await crypto.subtle.digest("SHA-256", fileContent);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
	return `sha256:${hashHex}`;
}

async function checkPreconditions(
	plugin: ObsidianVerticalTabs
): Promise<boolean> {
	if (!(await plugin.isBetaVersion())) return false;
	const manifest = plugin.manifest;
	if (!manifest.timestamp || !manifest.files) return false;
	return true;
}

function getPluginPath(plugin: ObsidianVerticalTabs): string {
	const root = plugin.app.plugins.getPluginFolder();
	const id = plugin.manifest.id;
	return normalizePath(`${root}/${id}`);
}

async function checkFileHashes(plugin: ObsidianVerticalTabs): Promise<boolean> {
	const manifest = plugin.manifest;
	if (!manifest.files) return false;
	const pluginPath = getPluginPath(plugin);
	for (const [filename, expectedHash] of Object.entries(manifest.files)) {
		if (!expectedHash.startsWith("sha256:")) return false;
		try {
			const filePath = normalizePath(`${pluginPath}/${filename}`);
			const actualHash = await getFileHash(plugin.app, filePath);
			if (actualHash !== expectedHash) return false;
		} catch {
			return false;
		}
	}
	return true;
}

function deepSortKeys(obj: unknown): unknown {
	if (obj === null || typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map(deepSortKeys);
	const sortedKeys = Object.keys(obj as Record<string, unknown>).sort();
	const sortedObj: Record<string, unknown> = {};
	for (const key of sortedKeys) {
		sortedObj[key] = deepSortKeys((obj as Record<string, unknown>)[key]);
	}
	return sortedObj;
}

async function checkSignature(plugin: ObsidianVerticalTabs): Promise<boolean> {
	const pluginPath = getPluginPath(plugin);
	const manifestPath = normalizePath(`${pluginPath}/manifest.json`);
	const manifestContent = await plugin.app.vault.adapter.read(manifestPath);
	const manifest = JSON.parse(manifestContent);
	const signatureHex = manifest.signature;
	const publicKey = manifest.publicKey;
	if (!signatureHex || !publicKey) return false;
	if (EMBEDDED_PUBLIC_KEY && publicKey !== EMBEDDED_PUBLIC_KEY) return false;
	const manifestWithoutSignature = { ...manifest };
	delete manifestWithoutSignature.signature;
	const sortedManifest = deepSortKeys(manifestWithoutSignature);
	const canonicalJson = JSON.stringify(sortedManifest);
	return await verifyEd25519Signature(canonicalJson, signatureHex, publicKey);
}

// prettier-ignore
async function verifyEd25519Signature(
	message: string,
	signatureHex: string,
	publicKeyString: string | undefined
): Promise<boolean> {
	if (!publicKeyString) return false;
	try {
		const pemContents = publicKeyString.replace(/\s+/g, "");
		const keyData = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
		const publicKey = await crypto.subtle.importKey("spki", keyData, { name: "Ed25519" }, false, ["verify"]);
		const signature = Uint8Array.from(signatureHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
		const messageBuffer = new TextEncoder().encode(message);
		const isValid = await crypto.subtle.verify("Ed25519", publicKey, signature, messageBuffer);
		return isValid;
	} catch (error) {
		console.error("Ed25519 verification error:", error);
		return false;
	}
}

export async function verifyBetaIntegrity(
	plugin: ObsidianVerticalTabs
): Promise<boolean | null> {
	try {
		if (!(await checkPreconditions(plugin))) return null;
		if (!(await checkFileHashes(plugin))) return false;
		if (!(await checkSignature(plugin))) return false;
		return true;
	} catch {
		return false;
	}
}

interface VerticalTabsBetaHelperPlugin extends Plugin {
	requestSecurityContext: () => Promise<boolean>;
}

export async function shouldDisplayBetaSecurityInfo(
	plugin: ObsidianVerticalTabs
): Promise<boolean> {
	try {
		const app = plugin.app;
		const betaHelper = app.plugins.getPlugin(
			"vertical-tabs-beta-helper"
		) as VerticalTabsBetaHelperPlugin | null;
		if (!betaHelper) return true;
		return await betaHelper.requestSecurityContext();
	} catch {
		return true;
	}
}
