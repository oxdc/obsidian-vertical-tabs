import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

let targetVersion = process.env.npm_package_version;

// Check if version has beta format and update/append date
const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
const betaPattern = /^(.+)-beta-\d{8}$/;
const betaMatch = targetVersion.match(betaPattern);

if (betaMatch) {
	// Update existing beta date
	targetVersion = `${betaMatch[1]}-beta-${today}`;
} else {
	// Append beta date
	targetVersion = `${targetVersion}-beta-${today}`;
}

// Update package.json with the new version
let packageJson = JSON.parse(readFileSync("package.json", "utf8"));
packageJson.version = targetVersion;
writeFileSync("package.json", JSON.stringify(packageJson, null, "\t"));

// read minAppVersion from manifest.json and bump version to target version
let manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));

// update versions.json with target version and minAppVersion from manifest.json
let versions = JSON.parse(readFileSync("versions.json", "utf8"));
versions[targetVersion] = minAppVersion;
writeFileSync("versions.json", JSON.stringify(versions, null, "\t"));

// automatically commit and tag the release
execSync(`git commit -am "release ${targetVersion}"`);
try {
	execSync(`git tag -d ${targetVersion}`, { stdio: "ignore" });
} catch (error) {
	// tag doesn't exist, which is fine
}
execSync(`git tag -a ${targetVersion} -m "${targetVersion}"`);
