import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Where the didkit WASM lives.
 *
 * - Standalone binary: embedded in the executable; scripts/binary-entry.ts sets the path.
 * - Published npm build: a single bundled file with the WASM copied next to it
 *   (scripts/build.ts defines LEARNCARD_CLI_BUNDLED).
 * - From source: resolved from the workspace package.
 */
export const didkitWasmPath = (): string => {
    if (process.env.LEARNCARD_CLI_DIDKIT_WASM) return process.env.LEARNCARD_CLI_DIDKIT_WASM;

    return process.env.LEARNCARD_CLI_BUNDLED
        ? path.join(__dirname, 'didkit_wasm_bg.wasm')
        : require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm');
};

export const readDidkitWasm = (): Promise<Buffer> => fs.readFile(didkitWasmPath());
