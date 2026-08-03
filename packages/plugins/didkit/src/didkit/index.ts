import _init, { InitInput } from './pkg/didkit_wasm';

export * from './pkg/didkit_wasm';

let initialized = false;
let generating = false; // Mutex flag to allow first init call to acquire a lock

export const init = async (
    arg:
        | InitInput
        | Promise<InitInput> = 'https://assets.learncard.ai/didkit_wasm_bg-7fec99f61754f80762b56b9a4a6bd1ed2a36d26266b9f7c44f735d26b4dee3c7.wasm'
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
