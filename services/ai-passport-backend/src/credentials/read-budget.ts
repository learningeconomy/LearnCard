import { createHash, createHmac } from 'node:crypto';

import * as privacyKeys from '../ai/privacy-keys';
import { getLearnCardRequestBudget } from '../learncard/requestScope';

/*
 * Credential budget inside a request with a deadline (MCP tools). The batch
 * stops starting credentials once the time left, minus a reserve for the
 * learner-context synthesis, pseudonymization and the fresh consent check,
 * is too short; the unstarted ones are deferred and the tool returns context
 * from what loaded. Each read gets the smaller of a fixed cap and the time
 * left before that reserve. Env knobs are read directly (tests of modules
 * that load this one replace the env module).
 */

const positiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

type RequestBudget = { deadlineAt: number; budgetMs: number };

/** Longest any one credential read may take under a request deadline. */
export const credentialReadCapMs = (): number =>
    positiveInteger(process.env.CREDENTIAL_READ_TIMEOUT_MS, 3_000);

/** Shortest read timeout we hand out: prod reads take ~125ms and up. */
export const CREDENTIAL_READ_FLOOR_MS = 500;

/** A credential is not started with less than this left before the reserve. */
export const CREDENTIAL_MIN_START_MS = 500;

/** Time kept for synthesis and publication: MCP_SYNTHESIS_RESERVE_MS (8s), at
 *  most 40% of the request budget. */
export const synthesisReserveMs = (budgetMs: number): number =>
    Math.min(
        positiveInteger(process.env.MCP_SYNTHESIS_RESERVE_MS, 8_000),
        Math.floor(budgetMs * 0.4)
    );

const credentialTimeLeftMs = (budget: RequestBudget, now: number): number =>
    budget.deadlineAt - now - synthesisReserveMs(budget.budgetMs);

/** Whether the batch may start another credential. Always true with no deadline. */
export const credentialBudgetAllowsStart = ({
    now = performance.now(),
    budget = getLearnCardRequestBudget(),
}: { now?: number; budget?: RequestBudget } = {}): boolean =>
    budget === undefined || credentialTimeLeftMs(budget, now) >= CREDENTIAL_MIN_START_MS;

export const credentialReadTimeoutMs = ({
    now = performance.now(),
    budget = getLearnCardRequestBudget(),
}: { now?: number; budget?: RequestBudget } = {}): number | undefined => {
    // Without a request deadline the read keeps LEARNCARD_CALL_TIMEOUT_MS.
    if (budget === undefined) return undefined;
    const cap = credentialReadCapMs();
    return Math.max(
        CREDENTIAL_READ_FLOOR_MS,
        Math.min(cap, Math.floor(credentialTimeLeftMs(budget, now)))
    );
};

/** Reads under this are never "slow", whatever their timeout. */
export const CREDENTIAL_SLOW_READ_MIN_MS = 1_000;

/**
 * When a still-running read is logged as slow: half its timeout, between
 * CREDENTIAL_SLOW_READ_MIN_MS and CREDENTIAL_SLOW_READ_MS (2s). Undefined when
 * that is not before the timeout (the timeout itself is logged as a skip).
 */
export const credentialSlowReadMs = (timeoutMs: number): number | undefined => {
    const threshold = Math.max(
        CREDENTIAL_SLOW_READ_MIN_MS,
        Math.min(
            positiveInteger(process.env.CREDENTIAL_SLOW_READ_MS, 2_000),
            Math.floor(timeoutMs / 2)
        )
    );
    return threshold < timeoutMs ? threshold : undefined;
};

/*
 * A short, keyed, non-reversible URI fingerprint for log correlation only.
 * Never a Sentry tag and never logged next to the URI. HMAC with the privacy
 * reference key; a truncated namespaced SHA-256 only if that key is absent.
 */
export const credentialUriHash = (uri: string): string => {
    const material = `credential-uri:v1\n${uri}`;
    try {
        return createHmac('sha256', privacyKeys.getPrivacyKeyMaterial().reference)
            .update(material)
            .digest('hex')
            .slice(0, 12);
    } catch {
        return createHash('sha256').update(`ai-passport:${material}`).digest('hex').slice(0, 12);
    }
};
