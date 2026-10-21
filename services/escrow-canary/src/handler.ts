import { loadConfig } from './config';
import { createMetrics } from './metrics';
import { createSdk } from './sdk';
import { createSecretStore } from './secrets';
import { runCanary } from './runner';

export const handler = async (event: unknown): Promise<void> => {
    try {
        if (
            !event ||
            typeof event !== 'object' ||
            !('tier' in event) ||
            (event.tier !== 1 && event.tier !== 2) ||
            !('time' in event) ||
            typeof event.time !== 'string'
        )
            throw new Error('Invalid event');
        const config = loadConfig();
        await runCanary({ tier: event.tier, time: event.time }, config, {
            secrets: createSecretStore(),
            sdk: createSdk(config),
            emit: createMetrics(config.environment, event.tier),
        });
    } catch {
        // Startup failures intentionally produce missing-data alarms, never raw exception payloads.
        console.error('Escrow canary initialization failed');
    }
};
