import type { Page } from '@playwright/test';
import type { inferRouterOutputs } from '@trpc/server';
import type { AppRouter as BrainRouter } from '@learncard/network-brain-service';
import type { AppRouter as CloudRouter } from '@learncard/learn-cloud-service';

/**
 * Response types inferred from the REAL routers. Anchoring mock payloads to
 * these (via `satisfies`) turns any backend schema change into a compile error,
 * which is the primary drift guard for this mocked tier. Example:
 *
 *   mock.on('boost.createBoost', () =>
 *       'boost:mock:1' satisfies BrainOutputs['boost']['createBoost']
 *   );
 */
export type BrainOutputs = inferRouterOutputs<BrainRouter>;
export type CloudOutputs = inferRouterOutputs<CloudRouter>;

/** Return this from a handler to fail the call (renders the retry-able error path). */
export const ABORT = Symbol('trpc-mock-abort');

type Handler = (input: unknown) => unknown | typeof ABORT;

/**
 * Minimal tRPC mock for Playwright. Both brain-service and learn-cloud speak
 * tRPC v11 over httpBatchLink at `/trpc` with an IDENTITY output transformer,
 * so responses are plain JSON: a batch of ops keyed by index, each shaped
 * `{ result: { data } }`. Procedure names arrive comma-joined in the URL path
 * (`/trpc/proc.a,proc.b`); inputs (unused here) arrive in the POST body.
 */
export const createTrpcMock = (page: Page) => {
    const handlers = new Map<string, Handler>();

    const on = (procedure: string, handler: Handler): void => {
        handlers.set(procedure, handler);
    };

    const install = async (): Promise<void> => {
        await page.route('**/trpc/**', async route => {
            const path = new URL(route.request().url()).pathname;
            const segment = decodeURIComponent(path.slice(path.indexOf('/trpc/') + 6));
            const procedures = segment.split(',').filter(Boolean);

            // Defer to any other route (HAR baseline, later overrides) when we
            // don't own every procedure in this batch.
            if (procedures.length === 0 || !procedures.every(p => handlers.has(p))) {
                return route.fallback();
            }

            let body: Record<string, { input?: unknown }> = {};
            try {
                body = JSON.parse(route.request().postData() ?? '{}');
            } catch {
                body = {};
            }

            const payload: Record<string, { result: { data: unknown } }> = {};
            for (let i = 0; i < procedures.length; i++) {
                const handler = handlers.get(procedures[i])!;
                const out = handler(body[String(i)]?.input);
                if (out === ABORT) return route.abort('failed');
                payload[String(i)] = { result: { data: out } };
            }

            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(payload),
            });
        });
    };

    return { on, install, ABORT };
};

export type TrpcMock = ReturnType<typeof createTrpcMock>;
