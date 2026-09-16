import type { FeedbackSource } from './types';

/**
 * Minimum time between two accepted shake triggers. Exactly 10 seconds per
 * the LC-2086 spec — further shakes inside the window are ignored.
 */
export const SHAKE_COOLDOWN_MS = 10_000;

/**
 * How long a deferred automatic draft may stay pending before it is
 * discarded. Exactly 5 minutes per the LC-2086 spec.
 */
export const PENDING_FEEDBACK_TTL_MS = 300_000;

/**
 * Whether a source is an automatic trigger (`shake` / `screenshot`).
 * Automatic triggers are subject to cooldown, busy-state deferral, and
 * pending-draft expiry; explicit sources are not.
 */
export const isAutomaticFeedbackSource = (source: FeedbackSource): boolean =>
    source === 'shake' || source === 'screenshot';

/**
 * Whether a shake at `now` must be ignored because another shake was
 * accepted less than `SHAKE_COOLDOWN_MS` ago.
 *
 * Clock skew producing a negative delta still suppresses the shake — the
 * cooldown fails closed rather than arming a spurious capture.
 */
export const isShakeInCooldown = (now: number, lastShakeAt: number | undefined): boolean => {
    if (lastShakeAt === undefined) return false;

    return now - lastShakeAt < SHAKE_COOLDOWN_MS;
};

/**
 * Whether a pending automatic draft captured at `capturedAt` (ISO-8601) has
 * exceeded `PENDING_FEEDBACK_TTL_MS` relative to `now` (epoch ms) and must be
 * discarded. A draft is expired exactly at the TTL boundary, and an
 * unparseable capture timestamp is treated as expired so a corrupt draft can
 * never wedge the pending slot.
 */
export const isPendingFeedbackExpired = (capturedAt: string, now: number): boolean => {
    const capturedAtMs = Date.parse(capturedAt);
    if (Number.isNaN(capturedAtMs)) return true;

    return now - capturedAtMs >= PENDING_FEEDBACK_TTL_MS;
};
