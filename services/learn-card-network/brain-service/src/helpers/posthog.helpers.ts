import { environment } from '@environment';
import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

/**
 * Production kill switch for sendCredential PostHog telemetry.
 *
 * Set ENABLE_SEND_CREDENTIAL_TELEMETRY=true (string, exact match) to allow
 * `bench.appevent.iteration` / `bench.appevent.run` events to emit. Any other
 * value (including unset) is a hard no-op: captureBenchEvent returns false
 * without initializing the PostHog client.
 *
 * This backend operational switch is independent of frontend analytics configuration
 * and can be changed without a code redeploy.
 */
const isTelemetryEnabled = (): boolean => environment.ENABLE_SEND_CREDENTIAL_TELEMETRY;

const getClient = (): PostHog | null => {
    if (client !== undefined) return client;
    const apiKey = environment.POSTHOG_API_KEY;
    if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('[PostHog] POSTHOG_API_KEY not set — bench events will not be emitted');
        client = null;
        return null;
    }
    const host = environment.POSTHOG_HOST ?? 'https://us.i.posthog.com';
    try {
        client = new PostHog(apiKey, { host, flushAt: 1, flushInterval: 0 });
        // eslint-disable-next-line no-console
        console.log(
            `[PostHog] initialized (host=${host}, key=${apiKey.slice(0, 8)}…${apiKey.slice(-4)})`
        );
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[PostHog] initialization failed:', err);
        client = null;
    }
    return client;
};

export type BenchEventName = 'bench.appevent.iteration' | 'bench.appevent.run';

export const captureBenchEvent = async (
    event: BenchEventName,
    properties: Record<string, unknown>
): Promise<boolean> => {
    if (!isTelemetryEnabled()) return false;
    const ph = getClient();
    if (!ph) return false;
    try {
        ph.capture({
            distinctId: 'brain-service-bench',
            event,
            properties: {
                ...properties,
                env: environment.NODE_ENV ?? 'development',
                commit_sha: environment.GIT_SHA ?? 'unknown',
            },
        });
        // eslint-disable-next-line no-console
        console.log(`[PostHog] captured event: ${event}`);
        return true;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[PostHog] capture failed for event ${event}:`, err);
        return false;
    }
};

export const flushBenchEvents = async (): Promise<void> => {
    if (!isTelemetryEnabled()) return;
    const ph = getClient();
    if (!ph) return;
    try {
        await ph.shutdown();
        // eslint-disable-next-line no-console
        console.log('[PostHog] flushed and shut down client');
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[PostHog] shutdown failed:', err);
    }
    client = undefined;
};
