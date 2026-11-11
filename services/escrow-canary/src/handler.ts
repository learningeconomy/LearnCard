import { loadConfig } from './config';
import { accountForEvent, createMetrics, type Emit } from './metrics';
import { createSdk } from './sdk';
import { createSecretStore } from './secrets';
import { runCanary } from './runner';
import { handleTier3 } from './tier3/handler';

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

/** Strict: only '1' | '2' | '3'. Anything else is a configuration error. */
export const parseTier = (value: string | undefined): 1 | 2 | 3 | undefined =>
    value === '1' ? 1 : value === '2' ? 2 : value === '3' ? 3 : undefined;

const tier3Handler = async (
    event: unknown,
    environment: 'staging' | 'production'
): Promise<void> => {
    const emit = createMetrics(environment, 3);
    const role = process.env.CANARY_ROLE;
    try {
        if (
            (role !== 'runner' && role !== 'evaluator') ||
            !event ||
            typeof event !== 'object' ||
            !('tier' in event) ||
            event.tier !== 3 ||
            !('role' in event) ||
            event.role !== role ||
            !('time' in event) ||
            typeof event.time !== 'string'
        )
            throw new Error('Invalid event');
        await handleTier3(role, { time: event.time }, emit);
    } catch (error) {
        // Constructor name only. The evaluator emits no metric here: its missing heartbeat pages.
        console.log(
            JSON.stringify({
                event: 'escrow-canary.handler.error',
                errorName: constructorName(error),
            })
        );
    }
};

export const handler = async (event: unknown): Promise<void> => {
    const environment = process.env.CANARY_ENVIRONMENT === 'production' ? 'production' : 'staging';
    const parsed = parseTier(process.env.CANARY_TIER);
    if (parsed === 3) return tier3Handler(event, environment);
    // The Lambda's configured tier is authoritative even for a malformed event.
    // An invalid CANARY_TIER never runs; it reports a tier-1 configuration failure.
    const tier = parsed ?? 1;
    const metrics = createMetrics(environment, tier);
    let reported = false;
    const emit: Emit = (...args) => {
        metrics(...args);
        if (args[0] === `Tier${tier}.Success`) reported = true;
    };
    let startupError: unknown;
    try {
        if (parsed === undefined) throw new Error('Invalid tier');
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
