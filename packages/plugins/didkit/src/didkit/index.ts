import _init, { InitInput } from './pkg/didkit_wasm';

export * from './pkg/didkit_wasm';

let initialized = false;
let generating = false;

export const init = async (
    arg: InitInput | Promise<InitInput> = 'https://cdn.filestackcontent.com/NXWgZbAoRVSr3oVsHXpX'
) => {
    while (generating) await new Promise(res => setTimeout(res, 250));

    // allow calling multiple times without reinitializing
    if (initialized) return;

    generating = true;

    await _init(arg);

    generating = false;
    initialized = true;
};

export default init;
