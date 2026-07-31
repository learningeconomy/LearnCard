import _init, { InitInput } from './pkg/didkit_wasm';

export * from './pkg/didkit_wasm';

let initialized = false;
let generating = false; // Mutex flag to allow first init call to acquire a lock

export const init = async (
    arg:
        | InitInput
        | Promise<InitInput> = 'https://assets.learncard.ai/didkit/sha256-dd685d6d0806b0fa882f18cec05587e470dcca94d96914662cddf775a362b40f/didkit_wasm_bg.wasm'
) => {
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
