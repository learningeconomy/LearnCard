import _init, { InitInput } from './pkg/didkit_wasm';

export * from './pkg/didkit_wasm';

let initialized = false;

export const init = async (
    arg: InitInput | Promise<InitInput> = 'https://cdn.filestackcontent.com/mg9PANmSiRzqPDfNluAa'
) => {
    // allow calling multiple times without reinitializing
    if (initialized) return;

    initialized = true;

    return _init(arg);
};

export default init;