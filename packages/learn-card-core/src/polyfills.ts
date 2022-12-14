import 'core-js/actual/promise';
import 'isomorphic-fetch';
import * as ac from 'abort-controller/dist/abort-controller';

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
