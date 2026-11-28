// Node globals some dependencies read at module scope. entry.client imports this first, so it runs
// before them, as the inline module script in the old index.html did.
import { Buffer } from 'buffer';
import process from 'process';

const browserGlobals = window as unknown as {
    Buffer: typeof Buffer;
    process: typeof process;
    global: typeof globalThis;
};
browserGlobals.Buffer = Buffer;
browserGlobals.process = process;
browserGlobals.global = globalThis;
