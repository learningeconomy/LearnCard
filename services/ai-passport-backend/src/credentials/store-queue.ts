import * as dataErasure from '../services/dataErasure';
import { logSafeEvent } from '../logging';
import { runOutsideLearnCardRequestScope } from '../learncard/requestScope';
import { runOutsideMcpProgress } from '../diagnostics/mcp-progress';

/*
 * Background store writes for MCP reads. A read tool returns as soon as it has
 * the projection; persisting the verification, the raw credential and
 * invalid-credential cleanup run here, never on the request path.
 *
 * - Each write holds its own detached owner operation, begun while the request
 *   still holds its own, so erasure still waits for (or fences out) the write
 *   and every write still re-checks consent before it lands.
 * - At most STORE_CONCURRENCY run at once; at most STORE_QUEUE_MAX wait. A
 *   write over that cap is dropped and counted: these rows are a cache of what
 *   ingestion and the next read rebuild.
 * - Failures are logged as allowlisted counts only (no error text, no URI).
 * - Writes run outside the request scope and the MCP call: the request's
 *   deadline and abort never cancel them, they share no request memo or
 *   consent read, and they never land in the call's mcp_tool_timing.
 */

const STORE_CONCURRENCY = 4;
const STORE_QUEUE_MAX = 256;

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

/** Queue `write` for `did` in the background. Never awaited by the caller. */
export const deferCredentialStore = (did: string, write: () => Promise<void>): void => {
    if (inFlight.size >= STORE_CONCURRENCY + STORE_QUEUE_MAX) {
        logSafeEvent('warn', 'credential_store_deferred_dropped', { count: 1 });
        return;
    }
    const job = runOutsideMcpProgress(() =>
        runOutsideLearnCardRequestScope(() =>
            dataErasure.withOwnerOperation(
                did,
                async () => {
                    await acquire();
                    try {
                        await write();
                    } finally {
                        release();
                    }
                },
                { detached: true }
            )
        )
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
