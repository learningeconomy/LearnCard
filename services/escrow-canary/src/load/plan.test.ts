import { describe, expect, it } from 'vitest';
import { LoadRefusal } from './errors';
import {
    buildPlan,
    isPinArrival,
    parseStages,
    pinCount,
    pinRateOverClientIpLimit,
    scheduleArrivals,
    stageArrivals,
} from './plan';

const refusal = (fn: () => unknown): string => {
    try {
        fn();
    } catch (error) {
        if (error instanceof LoadRefusal) return error.reason;
        throw error;
    }
    throw new Error('expected a refusal');
};

describe('parseStages', () => {
    it('parses rate:duration pairs', () => {
        expect(parseStages('0.5:300,2:600, 5:300,15:60')).toEqual([
            { rate: 0.5, durationSec: 300 },
            { rate: 2, durationSec: 600 },
            { rate: 5, durationSec: 300 },
            { rate: 15, durationSec: 60 },
        ]);
    });
    it.each([
        [undefined, 'stages_required'],
        ['', 'stages_required'],
        ['5', 'stages_format'],
        ['5:', 'stages_format'],
        ['-1:10', 'stages_format'],
        ['0:10', 'stages_rate'],
        ['51:10', 'stages_rate'],
        ['1:0', 'stages_duration'],
        ['1:7201', 'stages_duration'],
        ['1:1.5', 'stages_format'],
        [Array.from({ length: 21 }, () => '1:1').join(','), 'stages_count'],
    ])('refuses %s', (value, reason) => {
        expect(refusal(() => parseStages(value))).toBe(reason);
    });
});

describe('arrivals', () => {
    it('counts floor(rate x duration) arrivals per stage', () => {
        expect(stageArrivals({ rate: 0.5, durationSec: 3 })).toBe(1);
        expect(stageArrivals({ rate: 2.5, durationSec: 10 })).toBe(25);
        expect(stageArrivals({ rate: 0.1, durationSec: 30 })).toBe(3);
    });
    it('interleaves exactly floor(n x ratio) PIN arrivals', () => {
        for (const ratio of [0, 0.1, 0.25, 1 / 3, 0.5, 0.9, 1]) {
            for (const n of [1, 7, 10, 100, 1001]) {
                const pins = Array.from({ length: n }, (_, i) => isPinArrival(i, ratio)).filter(
                    Boolean
                ).length;
                expect(pins).toBe(pinCount(n, ratio));
            }
        }
        expect(Array.from({ length: 10 }, (_, i) => isPinArrival(i, 0.2))).toEqual([
            false,
            false,
            false,
            false,
            true,
            false,
            false,
            false,
            false,
            true,
        ]);
    });
    it('schedules back-to-back stages at 1/rate spacing', () => {
        const arrivals = scheduleArrivals(
            [
                { rate: 1, durationSec: 2 },
                { rate: 4, durationSec: 1 },
            ],
            0.5
        );
        expect(arrivals.map(a => [a.stage, a.atMs, a.kind])).toEqual([
            [0, 0, 'enrol'],
            [0, 1000, 'pin'],
            [1, 2000, 'enrol'],
            [1, 2250, 'pin'],
            [1, 2500, 'enrol'],
            [1, 2750, 'pin'],
        ]);
        expect(arrivals.map(a => a.index)).toEqual([0, 1, 2, 3, 4, 5]);
    });
});

describe('buildPlan', () => {
    const stages = [
        { rate: 2, durationSec: 50 },
        { rate: 10, durationSec: 10 },
    ];
    it('derives users, emails and a Roughtime estimate', () => {
        const plan = buildPlan({ stages, pinRatio: 0.1, pinPool: 5, enrolWithPin: false });
        expect(plan).toMatchObject({
            arrivals: 200,
            pinOps: 20,
            enrolOps: 180,
            pinPool: 5,
            users: 185,
            expectedEmails: 40,
            maxEmails: 60,
            durationSec: 60,
        });
        expect(plan.roughtimePerServerEstimate).toBe(180 * 6 + 5 * 6 + 20 * 20);
        expect(
            buildPlan({ stages, pinRatio: 0.1, pinPool: 5, enrolWithPin: true })
                .roughtimePerServerEstimate
        ).toBe(180 * 12 + 5 * 6 + 20 * 20);
    });
    it('enrol-only plans send no email', () => {
        const plan = buildPlan({ stages, pinRatio: 0, pinPool: 0, enrolWithPin: true });
        expect(plan).toMatchObject({ pinOps: 0, expectedEmails: 0, maxEmails: 0, users: 200 });
    });
    it.each([
        [{ pinRatio: 0.1, pinPool: 0 }, 'pin_pool_required'],
        [{ pinRatio: 0, pinPool: 3 }, 'pin_pool_unused'],
        [{ pinRatio: 1.5, pinPool: 1 }, 'pin_ratio'],
        [{ pinRatio: Number.NaN, pinPool: 1 }, 'pin_ratio'],
        [{ pinRatio: 0.1, pinPool: 1.5 }, 'pin_pool'],
    ])('refuses %o', (input, reason) => {
        expect(refusal(() => buildPlan({ stages, enrolWithPin: false, ...input }))).toBe(reason);
    });
    it('refuses a plan with no arrivals', () => {
        expect(
            refusal(() =>
                buildPlan({
                    stages: [{ rate: 0.1, durationSec: 5 }],
                    pinRatio: 0,
                    pinPool: 0,
                    enrolWithPin: false,
                })
            )
        ).toBe('no_arrivals');
    });
});

describe('pinRateOverClientIpLimit', () => {
    it('flags stages whose PIN rate from one IP exceeds 20 per 60 s', () => {
        const stages = [
            { rate: 1, durationSec: 60 },
            { rate: 4, durationSec: 60 },
            { rate: 2, durationSec: 60 },
        ];
        // 1/s x 0.25 = 15/min; 4/s x 0.25 = 60/min; 2/s x 0.25 = 30/min.
        expect(pinRateOverClientIpLimit(stages, 0.25)).toEqual([
            { stage: 1, pinPerWindow: 60 },
            { stage: 2, pinPerWindow: 30 },
        ]);
        // Exactly at the limit is allowed (lca-api refuses only above 20).
        expect(pinRateOverClientIpLimit([{ rate: 1 / 3, durationSec: 60 }], 1)).toEqual([]);
        expect(pinRateOverClientIpLimit(stages, 0)).toEqual([]);
    });
});
