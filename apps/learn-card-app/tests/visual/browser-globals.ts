import { Buffer } from 'buffer';

// Source-only SDK dependencies expect these globals before module evaluation.
// Production initializes them in its entrypoint; this fixture has its own entry.
globalThis.Buffer = Buffer;
Object.assign(globalThis, {
    global: globalThis,
    process: {
        env: {},
        browser: true,
        version: '',
        nextTick: (cb: () => void) => setTimeout(cb, 0),
    },
});
