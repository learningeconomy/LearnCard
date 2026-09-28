import type { ShareLink } from '@learncard/types';

import type { ShareLinkRecord } from '../models/ShareLink';

/**
 * Explicit owner projection of a `ShareLinkRecord`.
 *
 * This is a deliberate field-by-field mapping, never a spread: the raw record
 * carries internal object refs, operation ids, leases, hashes, byte counts and
 * ciphertext bindings that must never reach a caller. `contentUrl` is
 * intentionally omitted here — the public resolve/content routes own the guarded
 * relative URL, and a LearnCloud object URL (or a fabricated decryption key)
 * must never be exposed.
 *
 * `viewCountingEnabled` is the FRESHLY re-resolved authoritative eligibility for
 * the owner (never the stale `minorPolicyViewCountingEnabled` snapshot alone and
 * never a caller field). When it is not exactly `true`, `viewCount` is omitted
 * and `lastViewedAt` is nulled so a formerly eligible owner's historical counts
 * stop leaking through get/mutation/status/retry.
 */
export const toOwnerShareLink = (
    record: ShareLinkRecord,
    viewCountingEnabled?: boolean
): ShareLink => {
    const countingEnabled = viewCountingEnabled === true;

    return {
        id: record.id,
        title: record.title,
        ...(record.note === null ? {} : { note: record.note }),
        selectedCount: record.selectedCount,
        version: record.version,
        contentVersion: record.contentVersion,
        status: record.status,
        contentState: record.contentState,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        expiresAt: record.expiresAt,
        stoppedAt: record.stoppedAt,
        ...(countingEnabled
            ? { lastViewedAt: record.lastViewedAt, viewCount: record.viewCount }
            : { lastViewedAt: null }),
        minorPolicy: {
            isMinor: record.minorPolicyIsMinor,
            policyResolved: record.minorPolicyResolved,
            defaultExpiryDays: record.minorPolicyDefaultExpiryDays === 365 ? 365 : 30,
            viewCountingEnabled: record.minorPolicyViewCountingEnabled,
        },
    };
};
