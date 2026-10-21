import { loadConfig } from './config';
import { accountForEvent, createMetrics, type Emit } from './metrics';
import { createSdk } from './sdk';
import { createSecretStore } from './secrets';
import { runCanary } from './runner';

export const handler = async (event: unknown): Promise<void> => {
    // The Lambda's configured tier is authoritative even for a malformed event.
    const tier = process.env.CANARY_TIER === '2' ? 2 : 1;
    const environment = process.env.CANARY_ENVIRONMENT === 'production' ? 'production' : 'staging';
    const metrics = createMetrics(environment, tier);
    let reported = false;
    const emit: Emit = (...args) => {
        metrics(...args);
        if (args[0] === `Tier${tier}.Success`) reported = true;
    };
    try {
        if (
            !event ||
            typeof event !== 'object' ||
            !('tier' in event) ||
            event.tier !== tier ||
            !('time' in event) ||
            typeof event.time !== 'string'
        )
            throw new Error('Invalid event');
        const config = loadConfig();
        await runCanary({ tier, time: event.time }, config, {
            secrets: createSecretStore(),
            sdk: createSdk(config),
            emit,
        });
    } catch {
        // Never send raw startup exceptions to Lambda logs.
    } finally {
        if (!reported)
            emit(
                `Tier${tier}.Success`,
                0,
                undefined,
                { reason: 'config' },
                {
                    account: accountForEvent(tier, Date.now()),
                }
            );
    }
};
