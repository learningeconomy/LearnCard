import { describe, expect, it } from 'vitest';

import {
    CONNECTION_QUALITY_THRESHOLDS,
    createConnectionQualityTracker,
    resolveAdvisoryQuality,
    selectLiveSamples,
    type ConnectionQualitySample,
} from './connectionQuality';

const BASE_TIME = 1_700_000_000_000;

const sample = (overrides: Partial<ConnectionQualitySample> = {}): ConnectionQualitySample => ({
    at: BASE_TIME,
    ok: true,
    durationMs: 1000,
    ...overrides,
});

describe('connectionQuality', () => {
    it('starts unknown with no evidence', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        expect(tracker.snapshot()).toEqual({ quality: 'unknown', reason: null });
    });

    it('never warns from one or two isolated slow responses', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        tracker.reportSample(sample({ durationMs: 4000 }));
        expect(tracker.snapshot().quality).toBe('unknown');

        tracker.reportSample(sample({ at: BASE_TIME + 1000, durationMs: 5000 }));
        expect(tracker.snapshot()).toEqual({ quality: 'unknown', reason: null });
    });

    it('declares poor after enough slow samples in the window', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        for (let i = 0; i < 3; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i * 100, durationMs: 3000 }));
        }

        expect(tracker.snapshot()).toEqual({ quality: 'poor', reason: 'slow' });
    });

    it('declares poor with reason unstable for transport failures', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        for (let i = 0; i < 3; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i * 100, ok: false }));
        }

        expect(tracker.snapshot()).toEqual({ quality: 'poor', reason: 'unstable' });
    });

    it('prefers unstable when both slow and failures exceed the threshold', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        tracker.reportSample(sample({ at: BASE_TIME, ok: false }));
        tracker.reportSample(sample({ at: BASE_TIME + 1, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 2, ok: false }));
        tracker.reportSample(sample({ at: BASE_TIME + 3, durationMs: 3200 }));

        expect(tracker.snapshot()).toEqual({ quality: 'poor', reason: 'unstable' });
    });

    it('is cleared by three consecutive healthy successes and starts fresh', () => {
        let time = BASE_TIME;
        const tracker = createConnectionQualityTracker({ now: () => time });

        for (let i = 0; i < 3; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i, durationMs: 3000 }));
        }
        expect(tracker.snapshot().quality).toBe('poor');

        for (let i = 0; i < 3; i += 1) {
            time = BASE_TIME + 10_000 + i;
            tracker.reportSample(sample({ at: time, durationMs: 800 }));
        }
        expect(tracker.snapshot()).toEqual({ quality: 'good', reason: null });

        // Evidence was cleared: one new slow sample must not resurrect the
        // old bad patch.
        time = BASE_TIME + 20_000;
        tracker.reportSample(sample({ at: time, durationMs: 3000 }));
        expect(tracker.snapshot().quality).not.toBe('poor');
    });

    it('treats durations at the threshold boundaries correctly', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        // 2500ms exactly is NOT slow (> slowMs), 1500ms exactly IS healthy.
        for (let i = 0; i < CONNECTION_QUALITY_THRESHOLDS.poorCount; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i, durationMs: 2500 }));
        }
        expect(tracker.snapshot().quality).toBe('unknown');

        for (let i = 0; i < CONNECTION_QUALITY_THRESHOLDS.consecutiveHealthyToClear; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + 10 + i, durationMs: 1500 }));
        }
        expect(tracker.snapshot().quality).toBe('good');
    });

    it('expires stale evidence after the window elapses', () => {
        let time = BASE_TIME;
        const tracker = createConnectionQualityTracker({ now: () => time });

        for (let i = 0; i < 3; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i, durationMs: 3000 }));
        }
        expect(tracker.snapshot().quality).toBe('poor');

        time = BASE_TIME + CONNECTION_QUALITY_THRESHOLDS.windowMs + 1;
        expect(tracker.snapshot()).toEqual({ quality: 'unknown', reason: null });
    });

    it('retains at most maxSamples live samples', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        // Four slow then one healthy: the healthy sample pushes the oldest
        // slow out, leaving 3 slow -> still poor. With only 4 retained it
        // would drop to 2 slow -> unknown. (5-sample cap keeps evidence.)
        tracker.reportSample(sample({ at: BASE_TIME, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 1, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 2, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 3, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 4, durationMs: 100 }));

        expect(tracker.snapshot().quality).toBe('poor');
        expect(
            selectLiveSamples(
                [
                    sample({ at: BASE_TIME, durationMs: 3000 }),
                    sample({ at: BASE_TIME + 1, durationMs: 3000 }),
                    sample({ at: BASE_TIME + 2, durationMs: 3000 }),
                    sample({ at: BASE_TIME + 3, durationMs: 3000 }),
                    sample({ at: BASE_TIME + 4, durationMs: 100 }),
                ],
                BASE_TIME + 4,
                CONNECTION_QUALITY_THRESHOLDS
            )
        ).toHaveLength(5);
    });

    it('bounds retained evidence on insertion: a large sequence never grows past maxSamples', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        // 2 500 slow samples in a row: unbounded append would retain ALL of
        // them forever. Retention must stay capped at maxSamples.
        for (let i = 0; i < 2_500; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i, durationMs: 3000 }));
            expect(tracker.retainedCount()).toBeLessThanOrEqual(
                CONNECTION_QUALITY_THRESHOLDS.maxSamples
            );
        }

        expect(tracker.retainedCount()).toBe(CONNECTION_QUALITY_THRESHOLDS.maxSamples);
        // Behavior is unchanged: the most recent 5 slow samples still warn.
        expect(tracker.snapshot()).toEqual({ quality: 'poor', reason: 'slow' });
    });

    it('trims exactly at the window boundary on insertion (strict inequality)', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        // A sample exactly windowMs old is EXPIRED (live requires
        // at > now - windowMs); it must be trimmed, not retained.
        tracker.reportSample(sample({ at: BASE_TIME - CONNECTION_QUALITY_THRESHOLDS.windowMs }));
        tracker.reportSample(
            sample({ at: BASE_TIME - CONNECTION_QUALITY_THRESHOLDS.windowMs + 1 })
        );

        expect(tracker.retainedCount()).toBe(1);
        expect(tracker.snapshot().quality).toBe('unknown');
    });

    it('nextExpiryAt returns the earliest live expiry and null with no live evidence', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });
        expect(tracker.nextExpiryAt()).toBeNull();

        tracker.reportSample(sample({ at: BASE_TIME + 10, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 50, durationMs: 3000 }));

        expect(tracker.nextExpiryAt()).toBe(
            BASE_TIME + 10 + CONNECTION_QUALITY_THRESHOLDS.windowMs
        );
    });

    it('reset() drops all evidence', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        for (let i = 0; i < 3; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i, durationMs: 3000 }));
        }
        expect(tracker.snapshot().quality).toBe('poor');

        tracker.reset();
        expect(tracker.snapshot()).toEqual({ quality: 'unknown', reason: null });
    });

    it('keeps an established good rating across quiet periods', () => {
        let time = BASE_TIME;
        const tracker = createConnectionQualityTracker({ now: () => time });

        for (let i = 0; i < 3; i += 1) {
            tracker.reportSample(sample({ at: BASE_TIME + i, durationMs: 500 }));
        }
        expect(tracker.snapshot().quality).toBe('good');

        time = BASE_TIME + CONNECTION_QUALITY_THRESHOLDS.windowMs * 3;
        expect(tracker.snapshot().quality).toBe('good');
    });

    describe('resolveAdvisoryQuality', () => {
        it('offline takes precedence over quality', () => {
            expect(resolveAdvisoryQuality('offline', 'poor')).toBe('unknown');
            expect(resolveAdvisoryQuality('offline', 'good')).toBe('unknown');
        });

        it('passes quality through for non-offline statuses', () => {
            expect(resolveAdvisoryQuality('online', 'poor')).toBe('poor');
            expect(resolveAdvisoryQuality('unknown', 'poor')).toBe('poor');
            expect(resolveAdvisoryQuality('online', 'good')).toBe('good');
        });
    });

    it('honors injectable thresholds', () => {
        const tracker = createConnectionQualityTracker({
            now: () => BASE_TIME,
            thresholds: { slowMs: 500, poorCount: 2, minSamplesForPoor: 2 },
        });

        tracker.reportSample(sample({ at: BASE_TIME, durationMs: 600 }));
        tracker.reportSample(sample({ at: BASE_TIME + 1, durationMs: 600 }));

        expect(tracker.snapshot()).toEqual({ quality: 'poor', reason: 'slow' });
    });

    it('ignores healthy samples without durations when clearing', () => {
        const tracker = createConnectionQualityTracker({ now: () => BASE_TIME });

        // ok:true without durationMs is neither healthy nor slow — it should
        // not count toward the consecutive-healthy clear.
        tracker.reportSample(sample({ at: BASE_TIME, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 1, durationMs: 3000 }));
        tracker.reportSample(sample({ at: BASE_TIME + 2, durationMs: 3000 }));
        expect(tracker.snapshot().quality).toBe('poor');

        tracker.reportSample(sample({ at: BASE_TIME + 3, ok: true }));
        tracker.reportSample(sample({ at: BASE_TIME + 4, ok: true }));
        expect(tracker.snapshot().quality).toBe('poor');
    });
});
