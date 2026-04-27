import { PostHog } from 'posthog-node';

let client: PostHog | null | undefined;

const getClient = (): PostHog | null => {
    if (client !== undefined) return client;
    const apiKey = process.env.POSTHOG_API_KEY;
    if (!apiKey) {
        client = null;
        return null;
    }
    try {
        client = new PostHog(apiKey, {
            host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
            flushAt: 1,
            flushInterval: 0,
        });
    } catch {
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
        return true;
    } catch {
        return false;
    }
};

export const flushBenchEvents = async (): Promise<void> => {
    const ph = getClient();
    if (!ph) return;
    try {
        await ph.shutdown();
    } catch {
        // ignore
    }
    client = undefined;
};
