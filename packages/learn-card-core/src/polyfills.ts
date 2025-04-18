import 'core-js/actual/promise';
import * as ac from 'abort-controller/dist/abort-controller.js';

const g: any =
    typeof globalThis !== 'undefined'
        ? globalThis
        : typeof self !== 'undefined'
            ? self
            : typeof window !== 'undefined'
                ? window
                : typeof global !== 'undefined'
                    ? global
                    : /* otherwise */ undefined;

if (g) {
    if (typeof g.AbortController === 'undefined') {
        g.AbortController = ac.AbortController;
    }
    if (typeof g.AbortSignal === 'undefined') {
        g.AbortSignal = ac.AbortSignal;
    }
}
