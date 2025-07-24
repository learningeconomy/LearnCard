import _init, { InitInput } from './pkg/didkit_wasm';

export * from './pkg/didkit_wasm';

let initialized = false;
let generating = false; // Mutex flag to allow first init call to acquire a lock

export const init = async (
    arg: InitInput | Promise<InitInput> = 'https://cdn.filestackcontent.com/HtQSwGymRJ2gCQsvhyC6'
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
