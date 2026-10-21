#!/usr/bin/env node
// Pure-Node static check (no install/build): the checked-in DIDKit WASM must match the
// content-addressed URL that `init()` falls back to.
//
// The wasm-bindgen glue in pkg/ only defines the closure-wrapper imports of the exact
// binary it was generated from, so the glue and the binary served by the default URL are
// version-locked. Rebuilding one without republishing the other makes every consumer that
// calls initLearnCard() without its own `didkit` argument fail at init with a LinkError
// such as: Import #109 "__wbindgen_closure_wrapper12353" requires a callable.
//
// This is a release-artifact invariant rather than a unit test, so it runs as its own CI
// job to avoid bailing the nx test graph for every package that depends on didkit-plugin.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const didkitDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'didkit');
const wasmPath = path.join(didkitDir, 'pkg', 'didkit_wasm_bg.wasm');
const indexPath = path.join(didkitDir, 'index.ts');

const urlMatch = readFileSync(indexPath, 'utf8').match(
    /export const DEFAULT_DIDKIT_WASM_URL\s*=\s*'([^']*)'/
);

if (!urlMatch) {
    console.error(`Could not find a DEFAULT_DIDKIT_WASM_URL assignment in ${indexPath}.`);
    process.exit(1);
}

const defaultUrl = urlMatch[1];

// Both published layouts are content-addressed. The nested form is what
// .github/workflows/update-didkit-wasm.yml writes; the flat form predates it. Anchored so a
// stray 64-hex string elsewhere in the URL cannot satisfy the check.
const contentAddressedPatterns = [
    /\/didkit\/sha256-([0-9a-f]{64})\/didkit_wasm_bg\.wasm$/,
    /\/didkit_wasm_bg-([0-9a-f]{64})\.wasm$/,
];
const shaMatch = contentAddressedPatterns.map(pattern => defaultUrl.match(pattern)).find(Boolean);

if (!shaMatch) {
    console.error(
        [
            `DEFAULT_DIDKIT_WASM_URL is not content-addressed: ${defaultUrl}`,
            '',
            'Expected one of:',
            '  https://<host>/didkit/sha256-<sha256>/didkit_wasm_bg.wasm',
            '  https://<host>/didkit_wasm_bg-<sha256>.wasm',
        ].join('\n')
    );
    process.exit(1);
}

const urlSha = shaMatch[1];
const binarySha = createHash('sha256').update(readFileSync(wasmPath)).digest('hex');

if (urlSha !== binarySha) {
    console.error(
        [
            'The checked-in DIDKit WASM does not match the default init() URL.',
            `  checked-in pkg/didkit_wasm_bg.wasm: ${binarySha}`,
            `  URL in src/didkit/index.ts:         ${urlSha}`,
            '',
            'The glue in pkg/ is generated from the checked-in binary, so serving a different',
            'binary from the URL produces a LinkError at init time.',
            '',
            'To resolve: publish the checked-in binary as',
            `  https://assets.learncard.ai/didkit/sha256-${binarySha}/didkit_wasm_bg.wasm`,
            'then point DEFAULT_DIDKIT_WASM_URL in src/didkit/index.ts at it. The Update DIDKit',
            'WASM workflow does both automatically when DIDKit or SSI changes.',
        ].join('\n')
    );
    process.exit(1);
}

console.log(`DIDKit WASM matches the default init() URL (sha256 ${binarySha}).`);
