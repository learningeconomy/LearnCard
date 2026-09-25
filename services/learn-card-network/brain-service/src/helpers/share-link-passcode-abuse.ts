import cache from '@cache';
import { environment } from '@environment';

// The short shared window limits distributed guessing while bounding the time
// an attacker can deny access to a legitimate recipient. Per-source limits
// preserve capacity for other recipients until the shared budget is exhausted.
const WINDOW_SECONDS = 60;
const SHARE_FAILURE_LIMIT = 24;
const SOURCE_FAILURE_LIMIT = 6;

const keys = (namespace: string, shareId: string, sourceIp?: string): [string, string] => [
    `share-link-passcode-fail:${namespace}:${shareId}`,
    `share-link-passcode-fail-source:${namespace}:${shareId}:${sourceIp ?? 'unknown'}`,
];

export const canAttemptSharePasscode = async (
    namespace: string,
    shareId: string,
    sourceIp?: string
): Promise<boolean> => {
    // Process-local fallback counters cannot stop rotated-IP guesses across
    // production workers. Protected access requires the shared Redis counter.
    if (environment.NODE_ENV === 'production' && !cache.redis) return false;
    const [shareKey, sourceKey] = keys(namespace, shareId, sourceIp);
    const [shareFailures, sourceFailures] = await Promise.all([
        cache.get(shareKey),
        cache.get(sourceKey),
    ]);
    // `undefined` means the cache failed; `null` means no failures yet.
    if (shareFailures === undefined || sourceFailures === undefined) return false;
    return (
        Number(shareFailures ?? 0) < SHARE_FAILURE_LIMIT &&
        Number(sourceFailures ?? 0) < SOURCE_FAILURE_LIMIT
    );
};

export const recordFailedSharePasscode = async (
    namespace: string,
    shareId: string,
    sourceIp?: string
): Promise<void> => {
    const [shareKey, sourceKey] = keys(namespace, shareId, sourceIp);
    // Atomic increments across Brain instances. Never store the submitted value.
    const counts = await Promise.all([
        cache.incr(shareKey, WINDOW_SECONDS),
        cache.incr(sourceKey, WINDOW_SECONDS),
    ]);
    if (counts.some(count => count === undefined)) throw new Error('passcode throttle unavailable');
};
