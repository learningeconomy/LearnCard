import cache from '@cache';

/**
 * LC-2409 confirm-current-PIN limits (see `escrow.enroll`). Shared so `getAccountContinuity`
 * can tell the client, before it rotates its auth share (which spends a share version), that a
 * confirm would be refused and it should go straight to "choose a new PIN".
 */
export const ESCROW_CONFIRM_HOURLY_LIMIT = 5;
export const ESCROW_CONFIRM_LIFETIME_LIMIT = 10;
export const ESCROW_CONFIRM_MAX_UNCOMMITTED_VERSIONS = 2;
export const ESCROW_CONFIRM_TTL_SECONDS = 400 * 24 * 60 * 60;

export const escrowConfirmKeys = (did: string, pinGeneration: number) => ({
    hourly: `escrow-confirm:${did}`,
    lifetime: `escrow-confirm-fail:${did}:${pinGeneration}`,
    versions: `escrow-confirm-versions:${did}`,
    /** Set once a confirm hit the lifetime or version cap; cleared by a new PIN generation. */
    blocked: `escrow-confirm-blocked:${did}`,
});

/**
 * Whether a confirm started now (on a fresh share version) would be refused with
 * `pin_change_required`: the lifetime cap was reached on this PIN, or the uncommitted-version
 * cap is full. Fails open (false) on Redis errors: the enroll route still enforces both.
 */
export const isEscrowConfirmBlocked = async (did: string): Promise<boolean> => {
    try {
        const redis = cache.redis ?? cache.node;
        const keys = escrowConfirmKeys(did, 0);
        if (await redis.get(keys.blocked)) return true;
        return (await redis.scard(keys.versions)) >= ESCROW_CONFIRM_MAX_UNCOMMITTED_VERSIONS;
    } catch {
        return false;
    }
};
