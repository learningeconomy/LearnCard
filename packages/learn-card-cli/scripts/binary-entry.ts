/**
 * Entry point for the standalone binary (see scripts/build-binary.ts).
 *
 * Embeds the didkit WASM in the executable and tells the bundled CLI where to find it,
 * then runs the same `dist/index.js` that is published to npm.
 */
// @ts-expect-error -- Bun file import: embeds the asset and yields its path inside the binary.
import didkitWasm from '../dist/didkit_wasm_bg.wasm' with { type: 'file' };

process.env.LEARNCARD_CLI_DIDKIT_WASM = didkitWasm;

// Loaded after the assignment above, so it must not be a static import (those are hoisted).
// @ts-expect-error -- build output, has no type declarations.
await import('../dist/index.js');
