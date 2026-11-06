import { readFile } from 'node:fs/promises';
import { initLearnCard } from '@learncard/init';
import type { DidWebNetworkLearnCardFromSeed } from '@learncard/init';
import {
    SEED,
    LEARNCARD_DID_WEB,
    LEARNCARD_NETWORK_URL,
    LEARNCARD_CLOUD_URL,
    LEARNCARD_INIT_TIMEOUT_MS,
    LEARNCARD_INIT_FAILURE_BACKOFF_MS,
} from '../constants/env';
import {
    describeLearnCardInitFailure,
    isRetryableCachedLearnCardFailure,
    isTransientLearnCardFailure,
    LearnCardUnavailableError,
} from './errors';
import { boundLearnCardCall, runOutsideLearnCardRequestScope } from './requestScope';

export type LearnCardInstance = DidWebNetworkLearnCardFromSeed['returnValue'];

export type GetLearnCardOptions = {
    /** Stop waiting when this aborts. Defaults to the request scope's signal. */
    signal?: AbortSignal;
    /**
     * If the last init failed transiently and is still inside its backoff,
     * start one fresh shared init instead of rejecting with that failure. For
     * consent gates, which fail the whole session without LearnCard. Identity
     * rejections and init timeouts keep their backoff.
     */
    retryTransientFailure?: boolean;
};

/**
 * One shared, bounded LearnCard initialization.
 *
 * - The init (SDK setup plus a signed getProfile) gets `initTimeoutMs`. A
 *   caller's signal only stops that caller waiting; it never cancels the
 *   shared init for everyone else.
 * - A failed init is remembered for `failureBackoffMs`, so a bad SEED or an
 *   outage costs one slow init per window instead of one per call.
 * - A transient init failure (a network or did:web resolution blip, a 5xx) is
 *   retried after `retryDelayMs`, inside the same `initTimeoutMs` bound. A
 *   rejected or misconfigured service identity (SEED's key not in the
 *   did:web document, or no such did:web) or a timeout is not retried.
 * - The failure keeps safe structured fields from its cause (tRPC code, HTTP
 *   status, errno, class) but never the message.
 */
export const createLearnCardLoader = <T>(
    initialize: () => Promise<T>,
    {
        initTimeoutMs,
        failureBackoffMs,
        retries = 1,
        retryDelayMs = 250,
        now = () => performance.now(),
    }: {
        initTimeoutMs: number;
        failureBackoffMs: number;
        /** Extra attempts after a transient failure, all inside initTimeoutMs. */
        retries?: number;
        retryDelayMs?: number;
        now?: () => number;
    }
) => {
    let initialization: Promise<T> | undefined;
    let failure: { error: LearnCardUnavailableError; until: number } | undefined;

    const initializeWithRetry = async (onAttempt: () => void): Promise<T> => {
        for (let attempt = 0; ; attempt += 1) {
            try {
                onAttempt();
                return await initialize();
            } catch (cause) {
                if (
                    attempt >= retries ||
                    !isTransientLearnCardFailure(describeLearnCardInitFailure(cause, 0))
                )
                    throw cause;
            }
            await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        }
    };

    const start = ({ warm = false }: { warm?: boolean } = {}): Promise<T> => {
        // The init is shared, so it must not belong to whichever request started
        // it: run it outside that request's scope and bound it only by its own
        // timeout. Callers still stop waiting on their own signals below.
        let attempts = 0;
        const attempt = boundLearnCardCall(
            runOutsideLearnCardRequestScope(() =>
                Promise.resolve().then(() =>
                    initializeWithRetry(() => {
                        attempts += 1;
                    })
                )
            ),
            { timeoutMs: initTimeoutMs, detached: true }
        ).catch((cause: unknown) => {
            const error = new LearnCardUnavailableError(
                describeLearnCardInitFailure(cause, attempts)
            );
            if (initialization === attempt) {
                initialization = undefined;
                // A failed boot warm-up must not cost the first real caller its init:
                // that caller starts a fresh one instead of waiting out a backoff.
                if (!warm) failure = { error, until: now() + failureBackoffMs };
            }
            throw error;
        });
        initialization = attempt;
        return attempt;
    };

    const load = (options: GetLearnCardOptions = {}): Promise<T> => {
        if (!initialization && failure) {
            if (
                now() < failure.until &&
                !(
                    options.retryTransientFailure &&
                    isRetryableCachedLearnCardFailure(failure.error.detail)
                )
            )
                return Promise.reject(failure.error);
            failure = undefined;
        }
        const shared = initialization ?? start();
        // Every caller is bounded by its own signal; the shared promise is not.
        return boundLearnCardCall(shared, { signal: options.signal });
    };

    /**
     * Start the shared init now, if nothing has started or failed yet, so the
     * first session doesn't pay for it. Never rejects; a failure is not cached.
     */
    const warm = (): Promise<'ready' | 'failed' | 'skipped'> => {
        if (initialization || failure) return Promise.resolve('skipped');
        return start({ warm: true }).then(
            () => 'ready' as const,
            () => 'failed' as const
        );
    };

    return Object.assign(load, { warm });
};

export type LearnCardLoader<T> = ReturnType<typeof createLearnCardLoader<T>>;

const didkit = readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm'));

/** The service identity's init options. scripts/diagnose-learncard.ts uses these too. */
export const serviceLearnCardInitOptions = () => {
    if (!SEED) throw new Error('LearnCard service seed is required');
    return {
        seed: SEED,
        didkit,
        network: LEARNCARD_NETWORK_URL,
        didWeb: LEARNCARD_DID_WEB,
        cloud: { url: LEARNCARD_CLOUD_URL, automaticallyAssociateDids: false },
    };
};

export const initServiceLearnCard = async (): Promise<LearnCardInstance> => {
    const { seed, network, didWeb, cloud } = serviceLearnCardInitOptions();
    const learnCard = await initLearnCard({
        seed,
        didkit,
        network,
        didWeb,
        cloud,
    });
    await learnCard.invoke.getProfile();
    return learnCard;
};

export const getLearnCard: LearnCardLoader<LearnCardInstance> = createLearnCardLoader(
    initServiceLearnCard,
    {
        initTimeoutMs: LEARNCARD_INIT_TIMEOUT_MS,
        failureBackoffMs: LEARNCARD_INIT_FAILURE_BACKOFF_MS,
    }
);
