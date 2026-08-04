import _init, { InitInput } from './pkg/didkit_wasm';

export * from './pkg/didkit_wasm';

let initialized = false;
let generating = false; // Mutex flag to allow first init call to acquire a lock

export const init = async (
    arg:
        | InitInput
        | Promise<InitInput> = 'https://assets.learncard.ai/didkit_wasm_bg-da82d7c815e8a3bd14ed9d8b866918a67cc3f03d34daca22ef41e4b9febe4be7.wasm'
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
