import { describe, expect, it } from 'vitest';

import {
    PENDING_FEEDBACK_TTL_MS,
    SHAKE_COOLDOWN_MS,
    isAutomaticFeedbackSource,
    isPendingFeedbackExpired,
    isShakeInCooldown,
} from './triggerPolicy';

describe('timing constants', () => {
    it('pins the spec-mandated values', () => {
        expect(SHAKE_COOLDOWN_MS).toBe(10_000);
        expect(PENDING_FEEDBACK_TTL_MS).toBe(300_000);
    });
});

describe('isAutomaticFeedbackSource', () => {
    it('treats shake and screenshot as automatic', () => {
        expect(isAutomaticFeedbackSource('shake')).toBe(true);
        expect(isAutomaticFeedbackSource('screenshot')).toBe(true);
    });

    it('treats explicit and internal sources as non-automatic', () => {
        expect(isAutomaticFeedbackSource('settings')).toBe(false);
        expect(isAutomaticFeedbackSource('error-boundary')).toBe(false);
        expect(isAutomaticFeedbackSource('micro-feedback')).toBe(false);
    });
});

describe('isShakeInCooldown', () => {
    it('is in cooldown one millisecond before the boundary', () => {
        expect(isShakeInCooldown(19_999, 10_000)).toBe(true);
    });

    it('exits cooldown exactly at the boundary', () => {
        expect(isShakeInCooldown(20_000, 10_000)).toBe(false);
    });

    it('has no cooldown before the first accepted shake', () => {
        expect(isShakeInCooldown(100_000, undefined)).toBe(false);
    });

    it('fails closed when timestamps skew backwards', () => {
        // A negative delta (clock adjusted backwards) still suppresses the
        // shake rather than arming a spurious capture.
        expect(isShakeInCooldown(5_000, 10_000)).toBe(true);
    });
});

describe('isPendingFeedbackExpired', () => {
    it('expires a draft exactly at the TTL', () => {
        expect(
            isPendingFeedbackExpired(
                '2026-08-20T12:00:00.000Z',
                Date.parse('2026-08-20T12:05:00.000Z')
            )
        ).toBe(true);
    });

    it('keeps a draft one millisecond before the TTL', () => {
        expect(
            isPendingFeedbackExpired(
                '2026-08-20T12:00:00.000Z',
                Date.parse('2026-08-20T12:04:59.999Z')
            )
        ).toBe(false);
    });

    it('discards a draft with an unparseable capture timestamp', () => {
        expect(isPendingFeedbackExpired('not-a-date', 0)).toBe(true);
    });
});
