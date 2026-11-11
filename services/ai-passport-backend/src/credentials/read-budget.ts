import { createHash, createHmac } from 'node:crypto';

import * as privacyKeys from '../ai/privacy-keys';
import { getLearnCardRequestDeadline } from '../learncard/requestScope';

/*
 * Per-credential read budget. One shared-context batch runs at a bounded
 * concurrency, so a read that hangs for the whole LEARNCARD_CALL_TIMEOUT_MS
 * holds a worker for a full wave. Each read gets the smaller of a fixed cap and
 * its share of the time left before the request deadline, so a batch with a
 * hung read still finishes and leaves time for verification and synthesis.
 * Env knobs are read directly (tests of modules that load this one replace the
 * env module).
 */

const positiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/** Longest any one credential read may take under a request deadline. */
export const credentialReadCapMs = (): number =>
    positiveInteger(process.env.CREDENTIAL_READ_TIMEOUT_MS, 3_000);

/** Shortest read timeout we hand out, so a nearly spent budget still tries. */
export const CREDENTIAL_READ_FLOOR_MS = 250;

/** Share of the remaining request budget the reads may use; the rest is for
 *  verification, the consent rechecks and synthesis. */
export const CREDENTIAL_READ_BUDGET_SHARE = 0.5;

export const credentialReadTimeoutMs = ({
    pending,
    concurrency,
    now = performance.now(),
    deadlineAt = getLearnCardRequestDeadline(),
}: {
    /** Reads not yet started in this batch, including this one. */
    pending: number;
    concurrency: number;
    now?: number;
    deadlineAt?: number;
}): number | undefined => {
    // Without a request deadline the read keeps LEARNCARD_CALL_TIMEOUT_MS.
    if (deadlineAt === undefined) return undefined;
    const cap = credentialReadCapMs();
    const wavesLeft = Math.max(1, Math.ceil(Math.max(1, pending) / Math.max(1, concurrency)));
    const share = ((deadlineAt - now) * CREDENTIAL_READ_BUDGET_SHARE) / wavesLeft;
    return Math.max(CREDENTIAL_READ_FLOOR_MS, Math.min(cap, Math.floor(share)));
};

/** When a still-running read is logged as slow: half its timeout, at most this. */
export const credentialSlowReadMs = (timeoutMs: number): number =>
    Math.max(
        50,
        Math.min(
            positiveInteger(process.env.CREDENTIAL_SLOW_READ_MS, 2_000),
            Math.floor(timeoutMs / 2)
        )
    );

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
