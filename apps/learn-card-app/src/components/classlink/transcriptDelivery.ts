import * as m from '../../paraglide/messages.js';

/**
 * How the app presents the wait for a requested transcript, from the issuer's estimate:
 * - `quick`: no estimate, or 30 seconds or less. Live steps; it usually just arrives.
 * - `timed`: up to a few minutes. A progress bar and time left, so the wait reads as progress.
 * - `later`: longer. Confirm the request and when to expect it, then let the student move on.
 */
export type DeliveryPace = 'quick' | 'timed' | 'later';

export const QUICK_DELIVERY_MS = 30_000;
export const TIMED_DELIVERY_MAX_MS = 5 * 60_000;

/** A sliver of fill at the start, so the bar reads as alive from the first frame. */
const PROGRESS_START = 0.04;
/** Progress shown when the estimate is reached; the bar only completes on arrival. */
const PROGRESS_AT_ESTIMATE = 0.9;
const PROGRESS_CEILING = 0.97;

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const expectedSpan = (requestedAt: string, expectedBy: string): number =>
    Date.parse(expectedBy) - Date.parse(requestedAt);

export const getDeliveryPace = (requestedAt: string, expectedBy?: string): DeliveryPace => {
    if (!expectedBy) return 'quick';
    const span = expectedSpan(requestedAt, expectedBy);
    if (!Number.isFinite(span) || span <= QUICK_DELIVERY_MS) return 'quick';
    return span <= TIMED_DELIVERY_MAX_MS ? 'timed' : 'later';
};

/**
 * Fraction of the bar to fill. It eases out toward 90% at the estimate, then creeps toward
 * 97% so a late transcript still looks like it is moving, never finished and never stuck.
 */
export const getDeliveryProgress = (
    requestedAt: string,
    expectedBy: string,
    now: number
): number => {
    const span = expectedSpan(requestedAt, expectedBy);
    if (!Number.isFinite(span) || span <= 0) return PROGRESS_AT_ESTIMATE;
    const elapsed = Math.max(0, now - Date.parse(requestedAt));
    if (elapsed <= span) {
        const t = elapsed / span;
        return PROGRESS_START + (PROGRESS_AT_ESTIMATE - PROGRESS_START) * (1 - (1 - t) ** 2);
    }
    const overrun = (elapsed - span) / span;
    return (
        PROGRESS_AT_ESTIMATE + (PROGRESS_CEILING - PROGRESS_AT_ESTIMATE) * (1 - Math.exp(-overrun))
    );
};

/** "About 2 minutes left", stepping down coarsely so screen readers aren't flooded. */
export const getTimeLeftLabel = (expectedBy: string, now: number): string => {
    const left = Date.parse(expectedBy) - now;
    if (left <= 5_000) return m['transcriptOptIn.delivery.almostThere']();
    if (left < MINUTE) {
        const seconds = Math.ceil(left / 10_000) * 10;
        return m['transcriptOptIn.delivery.secondsLeft']({ seconds: String(seconds) });
    }
    const minutes = Math.max(1, Math.round(left / MINUTE));
    return minutes === 1
        ? m['transcriptOptIn.delivery.oneMinuteLeft']()
        : m['transcriptOptIn.delivery.minutesLeft']({ minutes: String(minutes) });
};

/**
 * When to expect a `later` transcript, phrased to finish "Your school expects to send it …":
 * "in 3 hours", "tomorrow", "in 3 days", or "by November 20" a week or more out.
 */
export const formatExpectedDelivery = (expectedBy: string, now: number, locale: string): string => {
    const at = Date.parse(expectedBy);
    const left = Math.max(0, at - now);
    const relative = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    if (left < HOUR) return relative.format(Math.max(1, Math.ceil(left / MINUTE)), 'minute');
    if (left < DAY) return relative.format(Math.ceil(left / HOUR), 'hour');
    const startOfDay = (time: number): number => new Date(time).setHours(0, 0, 0, 0);
    const days = Math.round((startOfDay(at) - startOfDay(now)) / DAY);
    if (days < 7) return relative.format(days, 'day');
    const date = new Date(at).toLocaleDateString(locale, { month: 'long', day: 'numeric' });
    return m['transcriptOptIn.delivery.byDate']({ date });
};

/**
 * When a still-pending request should offer manual recovery (check again, notifications):
 * a day after it was made, or a day after the issuer's estimate if that is later.
 */
export const getStaleAt = (
    requestedAt: string,
    expectedBy: string | undefined,
    staleAfterMs: number
): number => {
    const byRequest = Date.parse(requestedAt) + staleAfterMs;
    const byEstimate = expectedBy ? Date.parse(expectedBy) + staleAfterMs : 0;
    return Math.max(byRequest, Number.isFinite(byEstimate) ? byEstimate : 0);
};
