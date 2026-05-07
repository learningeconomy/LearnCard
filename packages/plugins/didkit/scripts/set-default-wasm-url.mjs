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
const defaultArgPattern = /(arg:\s*InitInput\s*\|\s*Promise<InitInput>\s*=\s*)'[^']+'/;

if (!defaultArgPattern.test(source)) {
    console.error(`Could not find the default DIDKit WASM URL in ${didkitIndexPath}`);
    process.exit(1);
}

const updated = source.replace(defaultArgPattern, (_match, prefix) => `${prefix}'${escapedUrl}'`);

await writeFile(didkitIndexPath, updated);

console.log(`Updated default DIDKit WASM URL to ${wasmUrl}`);

