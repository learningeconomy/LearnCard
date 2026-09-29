import type { Context } from 'aws-lambda';

import {
    createShareLinkMaintenanceRuntime,
    type ShareLinkMaintenanceRuntime,
} from './src/helpers/share-link-maintenance';

/**
 * Dedicated LC-2187 share-link maintenance Lambda entrypoint.
 *
 * It deliberately does NOT import `lambda.ts`, so no unrelated embedding
 * backfill, tRPC router, Sentry input capture or inbox handler runs at import
 * time. The only side effect is resolving the service and maintenance
 * configuration; when it is absent or malformed the runtime is inert and the
 * handler performs no graph, remote or signing work.
 *
 * The scheduled event payload is ignored entirely: it can never override the
 * namespace, origin, audience or any other configuration, and it is never
 * logged.
 */

let runtime: ShareLinkMaintenanceRuntime | null = null;

const getRuntime = (): ShareLinkMaintenanceRuntime => {
    if (runtime === null) {
        runtime = createShareLinkMaintenanceRuntime({
            rawEnvironment: process.env as Record<string, unknown>,
        });
    }

    return runtime;
};

export const shareLinkMaintenanceHandler = async (
    _event: unknown,
    context?: Pick<Context, 'getRemainingTimeInMillis'>
): Promise<{ status: string }> => {
    const hasRemainingTime = typeof context?.getRemainingTimeInMillis === 'function';

    const summary = await getRuntime().runOnce({
        // Preserve the LIVE Lambda remaining-time source: the runtime samples it
        // once, before dependency initialization, and anchors the invocation
        // budget to that instant.
        remainingTimeMs: hasRemainingTime ? () => context!.getRemainingTimeInMillis() : undefined,
    });

    // The runtime already emitted one aggregate-only allowlisted event.
    return { status: summary.status };
};
