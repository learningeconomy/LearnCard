import cache from '@cache';
import { environment } from '@environment';

// The short shared window limits distributed guessing while bounding the time
// an attacker can deny access to a legitimate recipient. Per-source limits
// preserve capacity for other recipients until the shared budget is exhausted.
const WINDOW_SECONDS = 60;
// A successful recipient view checks the passcode at resolve and content, so
// it spends two attempts. Keep that in mind before lowering these budgets.
const SHARE_ATTEMPT_LIMIT = 24;
const SOURCE_ATTEMPT_LIMIT = 6;

const keys = (namespace: string, shareId: string, sourceIp?: string): [string, string] => [
    `share-link-passcode-attempt:${namespace}:${shareId}`,
    `share-link-passcode-attempt-source:${namespace}:${shareId}:${sourceIp ?? 'unknown'}`,
];

export const reserveSharePasscodeAttempt = async (
    namespace: string,
    shareId: string,
    sourceIp?: string
): Promise<boolean> => {
    // Process-local fallback counters cannot stop rotated-IP guesses across
    // production workers. Protected access requires the shared Redis counter.
    if (environment.NODE_ENV === 'production' && !cache.redis) return false;
    const [shareKey, sourceKey] = keys(namespace, shareId, sourceIp);
    // Reserve before Argon2. Redis INCR is atomic across Lambda instances, so
    // simultaneous guesses cannot all read a stale budget. Count successful
    // attempts too; no cross-key refund race and no stored submitted value.
    const sourceCount = await cache.incr(sourceKey, WINDOW_SECONDS);
    if (sourceCount === undefined || sourceCount > SOURCE_ATTEMPT_LIMIT) return false;
    // Rejected requests from this source never consume another recipient's
    // share-wide budget. Both reservations still precede Argon2.
    const shareCount = await cache.incr(shareKey, WINDOW_SECONDS);
    return shareCount !== undefined && shareCount <= SHARE_ATTEMPT_LIMIT;
};
