import _init, { InitInput } from './pkg/didkit_wasm';

export * from './pkg/didkit_wasm';

/**
 * Version-locked with `./pkg/didkit_wasm_bg.wasm`: the glue in `./pkg` only declares the imports
 * of the binary it was generated from, so both must be published together or consumers relying on
 * this default fail to instantiate with a `LinkError`.
 *
 * Kept as a standalone constant so `scripts/set-default-wasm-url.mjs` can rewrite it regardless of
 * how Prettier wraps the `init` signature. Do not inline it back into the parameter list.
 */
export const DEFAULT_DIDKIT_WASM_URL =
    'https://assets.learncard.ai/didkit/sha256-ba3e2ec2208f6da57d94e47c332b3226f048e11d7a23093d50b184d849b6bc0b/didkit_wasm_bg.wasm';

// One shared WASM init. Concurrent and repeated callers await the same promise; a failed
// init clears it so the next caller can retry instead of inheriting a poisoned rejection.
let initPromise: Promise<void> | undefined;

export const init = (arg: InitInput | Promise<InitInput> = DEFAULT_DIDKIT_WASM_URL) => {
    initPromise ??= _init({ module_or_path: arg }).then(
        () => undefined,
        error => {
            initPromise = undefined;

            throw error;
        }
    );

    return initPromise;
};

export default init;
