/**
 * Bundle-only replacement for `@learncard/didkit-plugin-node` (see scripts/build.ts).
 *
 * The native DIDKit addon ships per-platform binaries and cannot be bundled into one file, so
 * the self-contained CLI does not install it. `initLearnCard({ didkit: 'node' })` in the REPL
 * still works: it falls back to the bundled WebAssembly DIDKit, which has the same API.
 */
import { getDidKitPlugin as getWasmDidKitPlugin } from '@learncard/didkit-plugin';

import { readDidkitWasm } from '../../src/didkit-wasm';

let warned = false;

export const getDidKitPlugin = (
    _input?: unknown,
    allowRemoteContexts?: boolean
): ReturnType<typeof getWasmDidKitPlugin> => {
    if (!warned) {
        warned = true;
        console.warn(
            "didkit: 'node' is not available in the @learncard/cli bundle; using the built-in WebAssembly DIDKit instead."
        );
    }

    return getWasmDidKitPlugin(readDidkitWasm(), allowRemoteContexts);
};
