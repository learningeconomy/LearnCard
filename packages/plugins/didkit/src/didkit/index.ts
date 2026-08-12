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
    'https://assets.learncard.ai/didkit/sha256-60efb6027699fda135db0d817f7a541bbd660ae88bec9cbec9796feeb3740b96/didkit_wasm_bg.wasm';

let initialized = false;
let generating = false; // Mutex flag to allow first init call to acquire a lock

export const init = async (arg: InitInput | Promise<InitInput> = DEFAULT_DIDKIT_WASM_URL) => {
    // Do not return until we are done generating!
    while (generating) await new Promise(res => setTimeout(res, 250));

    // allow calling multiple times without reinitializing
    if (initialized) return;

    try {
        generating = true;

        await _init({ module_or_path: arg });

        generating = false;
        initialized = true;
    } catch (error) {
        generating = false;

        throw error;
    }
};

export default init;
