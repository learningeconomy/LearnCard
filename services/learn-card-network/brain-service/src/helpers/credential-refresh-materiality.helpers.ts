import { createHmac } from 'crypto';

import { canonicalizeCredentialContent, canonicalizeCredentialJson } from '@learncard/helpers';
import type { PublishCredentialRefreshNotification } from '@learncard/types';

import type { CredentialRefreshState } from 'types/credential-refresh';

/**
 * Notification materiality for managed credential refresh (LC-2136).
 *
 * After a publication commits, brain-service decides whether the holder should be
 * notified from a canonical projection of _user-visible_ credential content. The
 * projection is hashed with a server-keyed HMAC (never an unkeyed digest, which
 * could enable offline guessing of low-entropy claim values) and only the keyed
 * digest is persisted on the aggregate — plaintext never is.
 *
 * Task 12 wires the actual notification event emission; this module owns the
 * projection, the digest, and the decision.
 */

const IS_TEST_ENVIRONMENT = process.env.NODE_ENV === 'test';

// Test-only fallback so integration specs do not need to provision the secret.
// Production refuses to run without a dedicated, independently provisioned secret.
const TEST_ONLY_DIGEST_SECRET = 'credential-refresh-test-only-digest-secret';

/** Returns the dedicated HMAC secret for material digests. */
export const getCredentialRefreshDigestSecret = (): string => {
    const secret = process.env.CREDENTIAL_REFRESH_DIGEST_SECRET;

    if (secret && secret.length > 0) return secret;

    if (IS_TEST_ENVIRONMENT) return TEST_ONLY_DIGEST_SECRET;

    throw new Error(
        'CREDENTIAL_REFRESH_DIGEST_SECRET is required for managed credential refresh digests'
    );
};

/**
 * Keys excluded from the user-visible projection:
 *
 * - `proof`: proofs change on every re-issue and carry no user-visible meaning
 * - `id` / `issuer`: identity invariants enforced separately; never a "content" change
 * - `refreshService`: mechanism descriptor, not user-visible content
 * - `credentialStatus`: status mechanism descriptors move through their own
 *   revocation lifecycle notifications, not "credential updated" notifications
 * - `issuanceDate` / `validFrom`: issuance-only timestamp changes are excluded by
 *   design (user-visible `validUntil`/expiration changes ARE material)
 *
 * Internal managed-version metadata never enters the credential body, so it is not
 * listed here.
 */
const NON_MATERIAL_TOP_LEVEL_KEYS = new Set([
    'proof',
    'id',
    'issuer',
    'refreshService',
    'credentialStatus',
    'issuanceDate',
    'validFrom',
]);

type CredentialLike = Record<string, unknown>;

/**
 * Computes the canonical user-visible projection of a credential: every top-level
 * key except the non-material denylist, recursively canonicalized (sorted object
 * keys, preserved array order) so semantically identical content hashes identically.
 */
export const getMaterialCredentialProjection = (credential: CredentialLike): unknown =>
    canonicalizeCredentialContent(
        Object.fromEntries(
            Object.entries(credential).filter(([key]) => !NON_MATERIAL_TOP_LEVEL_KEYS.has(key))
        )
    );

/**
 * Server-keyed HMAC-SHA256 over the canonical user-visible projection. The keyed
 * digest lets the server detect material changes across versions without persisting
 * plaintext and without exposing an unkeyed content hash.
 */
export const computeCredentialMaterialDigest = (
    credential: CredentialLike,
    secret: string = getCredentialRefreshDigestSecret()
): string =>
    createHmac('sha256', secret)
        .update(canonicalizeCredentialJson(getMaterialCredentialProjection(credential)))
        .digest('base64url');

export type DecideCredentialRefreshNotificationParams = {
    /** Aggregate lifecycle state at publication time */
    state: CredentialRefreshState;
    /** Issuer override: true forces, false suppresses; unset defers to materiality */
    notifyHolder?: boolean;
    /** Digest stored on the aggregate from the previous publication (undefined for v1) */
    previousDigest?: string;
    /** Digest of the candidate being published */
    nextDigest: string;
};

/**
 * Decides the publication notification outcome.
 *
 * - Non-active aggregates (e.g. `awaiting_claim`) never notify at publish time —
 *   pre-claim publications are stored but not served and produce at most one
 *   notification after acceptance (handled by the claim lifecycle).
 * - `notifyHolder: true` forces `queued`; `false` forces `suppressed`.
 * - Otherwise the material comparison decides. A missing previous digest (the
 *   original version is bound holder-encrypted, so no digest could be computed for
 *   it) is conservatively treated as material.
 */
export const decideCredentialRefreshNotification = (
    params: DecideCredentialRefreshNotificationParams
): PublishCredentialRefreshNotification => {
    const { state, notifyHolder, previousDigest, nextDigest } = params;

    if (state !== 'active') return 'not-applicable';

    if (notifyHolder === true) return 'queued';
    if (notifyHolder === false) return 'suppressed';

    return !previousDigest || previousDigest !== nextDigest ? 'queued' : 'suppressed';
};

// --- Notification routing + delivery-window keys (LC-2136) -------------------

/**
 * Default collapse window (hours) for repeat refresh notifications. Overridable via
 * `CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS` (see the plan's configuration
 * contract).
 */
export const DEFAULT_CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = 24;

/**
 * The configured delivery window in hours. Invalid or unset configuration falls
 * back to the 24-hour default so notification collapse never breaks on a bad env.
 */
export const getCredentialRefreshNotificationWindowHours = (): number => {
    const raw = process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;

    if (!raw) return DEFAULT_CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;

    const parsed = Number(raw);

    return Number.isFinite(parsed) && parsed > 0
        ? parsed
        : DEFAULT_CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;
};

const hmacBase64Url = (input: string, secret: string): string =>
    createHmac('sha256', secret).update(input).digest('base64url');

/**
 * Opaque, stable per-refresh routing key: a server-keyed HMAC over the refreshId.
 * Window-independent, so downstream notification storage can correlate every
 * delivery window for the same refresh without a reversible identifier. Never
 * derived from credential content.
 */
export const computeCredentialRefreshRouteKey = (
    refreshId: string,
    secret: string = getCredentialRefreshDigestSecret()
): string => hmacBase64Url(`credential-refresh-route:v1:${refreshId}`, secret);

/**
 * Opaque delivery-window key: a server-keyed HMAC over (refreshId, configured
 * window size, window bucket). Repeat material updates inside the same configured
 * window share the key so downstream storage collapses them into one notification;
 * a new window bucket — or a changed configured window — produces a new key.
 * Never derived from credential content.
 */
export const computeCredentialRefreshDeliveryKey = (
    refreshId: string,
    at: Date = new Date(),
    windowHours: number = getCredentialRefreshNotificationWindowHours(),
    secret: string = getCredentialRefreshDigestSecret()
): string => {
    const bucket = Math.floor(at.getTime() / (windowHours * 3_600_000));

    return hmacBase64Url(
        `credential-refresh-delivery:v1:${refreshId}:${windowHours}:${bucket}`,
        secret
    );
};
