import { minify } from "terser";
import { readFileSync, writeFileSync } from "fs";
import crypto from "crypto";

const separate = (str) => new Set(str.split(" "));
const jsKeywords = separate(
	"break case catch class const continue debugger default delete do else enum export extends " +
		"false finally for function if import in instanceof new null return super switch this throw " +
		"true try typeof var void while with"
);
const jsStrictModeReservedWords = separate(
	"implements interface let package private protected public static yield"
);

class RandomNameGenerator {
	constructor(seed) {
		this.seed = seed || Date.now();
		this.counter = 0;
		this.usedNames = new Set();
	}

	generateName(length = 2) {
		const validChars =
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
		const validFirstChars =
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

		let name;
		do {
			const hash = crypto
				.createHash("sha256")
				.update(`${this.seed}_${this.counter++}`)
				.digest("hex");

			const firstCharIndex =
				parseInt(hash.substring(0, 2), 16) % validFirstChars.length;
			name = validFirstChars[firstCharIndex];

			for (let i = 1; i < length; i++) {
				const hashStart = i * 2;
				const hashEnd = hashStart + 2;
				const charIndex =
					parseInt(hash.substring(hashStart, hashEnd), 16) %
					validChars.length;
				name += validChars[charIndex];
			}

			const maxNamesAtLength = Math.pow(validChars.length, length);
			const usageThreshold = maxNamesAtLength * 0.8;
			if (this.usedNames.size > usageThreshold) {
				length++;
				continue;
			}
		} while (this.usedNames.has(name) || this.isReserved(name));

		this.usedNames.add(name);
		return name;
	}

	isReserved(name) {
		return (
			jsKeywords.has(name) ||
			jsStrictModeReservedWords.has(name) ||
			name.startsWith("_")
		);
	}
}

async function mangle() {
	const options = {
		mangle: {
			properties: false,
			toplevel: true,
		},
	};
	const code = readFileSync("dist/main.js", "utf8");
	const nameCache = {};
	await minify(code, { ...options, nameCache });
	const randomSeed = Math.random().toString(36).substring(2);
	const nameGenerator = new RandomNameGenerator(randomSeed);
	for (const name of Object.keys(nameCache.vars.props)) {
		const newName = nameGenerator.generateName();
		nameCache.vars.props[name] = newName;
	}
	const result = await minify(code, { ...options, nameCache });
	const finalCode = result.code;
	const finalCodeHash = crypto
		.createHash("sha256")
		.update(finalCode)
		.digest("hex");
	console.log(finalCodeHash);
	writeFileSync("dist/main.js", finalCode);
}

mangle();
