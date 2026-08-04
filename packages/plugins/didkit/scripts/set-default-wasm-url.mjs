#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const wasmUrl = process.argv[2];

if (!wasmUrl) {
    console.error('Usage: node set-default-wasm-url.mjs <https-url>');
    process.exit(1);
}

let parsedUrl;

try {
    parsedUrl = new URL(wasmUrl);
} catch {
    console.error(`Invalid URL: ${wasmUrl}`);
    process.exit(1);
}

if (parsedUrl.protocol !== 'https:') {
    console.error('The default DIDKit WASM URL must use https.');
    process.exit(1);
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(scriptDir, '..');
const didkitIndexPath = path.join(pluginRoot, 'src/didkit/index.ts');
const source = await readFile(didkitIndexPath, 'utf8');
const escapedUrl = wasmUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// Only whitespace sits between the identifier and the string literal, so this survives however
// Prettier chooses to wrap the assignment once a long content-addressed URL is written in.
const defaultUrlPattern = /(export const DEFAULT_DIDKIT_WASM_URL\s*=\s*)'[^']*'/;
const matches = source.match(new RegExp(defaultUrlPattern, 'g')) ?? [];

if (matches.length !== 1) {
    console.error(
        `Expected exactly one DEFAULT_DIDKIT_WASM_URL assignment in ${didkitIndexPath}, found ${matches.length}.`
    );
    process.exit(1);
}

const previousUrl = source.match(defaultUrlPattern)[0].match(/'([^']*)'/)[1];
const updated = source.replace(defaultUrlPattern, (_match, prefix) => `${prefix}'${escapedUrl}'`);

await writeFile(didkitIndexPath, updated);

// Re-read rather than trusting the in-memory replace, so a botched write cannot silently leave a
// stale URL pointing at a binary that was never published.
const verified = await readFile(didkitIndexPath, 'utf8');
const writtenUrl = verified.match(defaultUrlPattern)?.[0]?.match(/'([^']*)'/)?.[1];

if (writtenUrl !== wasmUrl) {
    console.error(
        `Failed to write the default DIDKit WASM URL. Expected ${wasmUrl}, found ${writtenUrl}.`
    );
    process.exit(1);
}

console.log(`Updated default DIDKit WASM URL:\n  from ${previousUrl}\n  to   ${wasmUrl}`);
