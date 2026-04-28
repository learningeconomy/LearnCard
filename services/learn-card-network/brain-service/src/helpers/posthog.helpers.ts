import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

const getClient = (): PostHog | null => {
    if (client !== undefined) return client;
    const apiKey = process.env.POSTHOG_API_KEY;
    if (!apiKey) {
        // eslint-disable-next-line no-console
        console.log('[PostHog] POSTHOG_API_KEY not set — bench events will not be emitted');
        client = null;
        return null;
    }
    const host = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com';
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

export type BenchEventName =
    | 'bench.appevent.iteration'
    | 'bench.appevent.run';

export const captureBenchEvent = async (
    event: BenchEventName,
    properties: Record<string, unknown>
): Promise<boolean> => {
    const ph = getClient();
    if (!ph) return false;
    try {
        ph.capture({
            distinctId: 'brain-service-bench',
            event,
            properties: {
                ...properties,
                env: process.env.NODE_ENV ?? 'development',
                commit_sha: process.env.GIT_SHA ?? 'unknown',
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
