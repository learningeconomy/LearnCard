import { freemem } from 'node:os';

const GiB = 1024 ** 3;

// Playwright reports a renderer killed mid-call (usually the kernel OOM killer) this way.
const BROWSER_CRASH = /\b(Page crashed|Target crashed)\b/;

/** Explains a browser crash as likely memory pressure; undefined for every other failure. */
export const browserCrashHint = (
    error: unknown,
    freeBytes: number = freemem()
): string | undefined => {
    const text = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
    if (!BROWSER_CRASH.test(text)) return undefined;
    return `Chromium crashed, most likely out of memory (${(freeBytes / GiB).toFixed(1)} GiB free now). --fresh also runs the Docker stack on this host; below roughly 12-16 GiB RAM, run the browser journeys inside run all or against an existing --dir.`;
};
