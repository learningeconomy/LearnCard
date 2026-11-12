import * as dataErasure from '../services/dataErasure';
import { logSafeEvent } from '../logging';
import { runOutsideLearnCardRequestScope } from '../learncard/requestScope';
import { waitForCredentialContextIdle } from './batch';

/*
 * Background store writes for MCP reads. A read tool returns as soon as it has
 * the projection; persisting the verification, the raw credential,
 * invalid-credential cleanup and cache writes run here, never on the request
 * path, and never while a request for that owner is still reading.
 *
 * - A queued write waits until no credential context read is active for the
 *   owner (the same yield the in-app credential preload uses for a chat
 *   start, batch.ts waitForCredentialContextIdle), at most STORE_IDLE_WAIT_MS.
 *   So the request's fence checks and reads never queue behind these writes
 *   on Redis or the Mongo pool.
 * - Each write then runs outside the request's owner operation, in its own
 *   (withOwnerOperation), so erasure still waits for or fences out the write,
 *   and every write still re-checks consent before it lands.
 * - At most STORE_CONCURRENCY run at once; at most STORE_QUEUE_MAX wait. A
 *   write over that cap is dropped and counted: these rows are a cache of what
 *   ingestion and the next read rebuild.
 * - Failures are logged as allowlisted counts only (no error text, no URI).
 * - Writes run outside the request scope: the request's deadline and abort
 *   never cancel them, and they share no request memo or consent read.
 */

const STORE_CONCURRENCY = 4;
const STORE_QUEUE_MAX = 256;
const STORE_IDLE_WAIT_MS = 60_000;

let running = 0;
const waiting: Array<() => void> = [];
const inFlight = new Set<Promise<void>>();

const acquire = async (): Promise<void> => {
    if (running < STORE_CONCURRENCY) {
        running += 1;
        return;
    }
    await new Promise<void>(resolve => waiting.push(resolve));
};

const release = (): void => {
    const next = waiting.shift();
    if (next) next();
    else running -= 1;
};

const outsideOwnerOperation = <T>(callback: () => T): T =>
    typeof dataErasure.runOutsideOwnerOperation === 'function'
        ? dataErasure.runOutsideOwnerOperation(callback)
        : callback();

/** Queue `write` for `did` in the background. Never awaited by the caller. */
export const deferCredentialStore = (did: string, write: () => Promise<void>): void => {
    if (inFlight.size >= STORE_CONCURRENCY + STORE_QUEUE_MAX) {
        logSafeEvent('warn', 'credential_store_deferred_dropped', { count: 1 });
        return;
    }
    const job = runOutsideLearnCardRequestScope(() =>
        outsideOwnerOperation(async () => {
            await waitForCredentialContextIdle(did, { maxMs: STORE_IDLE_WAIT_MS });
            await acquire();
            try {
                await dataErasure.withOwnerOperation(did, () => write());
            } finally {
                release();
            }
        })
    ).catch(() => {
        logSafeEvent('error', 'credential_store_deferred_failed', { count: 1 });
    });
    inFlight.add(job);
    void job.finally(() => inFlight.delete(job));
};

/** Store writes queued or running in this process. */
export const pendingCredentialStores = (): number => inFlight.size;

/** Test and shutdown hook: wait for every queued store write to settle. */
export const drainCredentialStores = async (): Promise<void> => {
    while (inFlight.size) await Promise.allSettled([...inFlight]);
};
