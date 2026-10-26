import { loadConfig } from './config';
import { accountForEvent, createMetrics, type Emit } from './metrics';
import { createSdk } from './sdk';
import { createSecretStore } from './secrets';
import { runCanary } from './runner';

const handlerFailureReasons: Record<string, string> = {
    Error: 'config',
    RunnerAuthError: 'auth',
    EscrowPinMismatchError: 'pin_mismatch',
    EscrowPinThrottledError: 'rate_limit',
    EscrowRequestError: 'unexpected',
};

const constructorName = (error: unknown): string => {
    if (!error || (typeof error !== 'object' && typeof error !== 'function')) return 'UnknownError';
    const name = (error.constructor as { name?: unknown } | undefined)?.name;
    return typeof name === 'string' && name.length > 0 ? name : 'UnknownError';
};

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
    let startupError: unknown;
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
    } catch (error) {
        // Never send raw startup exceptions to Lambda logs.
        startupError = error;
        console.log(
            JSON.stringify({
                event: 'escrow-canary.handler.error',
                errorName: constructorName(error),
            })
        );
    } finally {
        if (!reported)
            emit(
                `Tier${tier}.Success`,
                0,
                undefined,
                { reason: handlerFailureReasons[constructorName(startupError)] ?? 'config' },
                {
                    account: accountForEvent(tier, Date.now()),
                }
            );
    }
};
