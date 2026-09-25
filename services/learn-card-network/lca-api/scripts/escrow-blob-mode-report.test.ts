import { describe, expect, it, vi } from 'vitest';

// Pure-logic test only: the script module (and, transitively, src/models/UserKey.ts)
// imports the real Mongo connection module for the CLI's live-query path, which
// requires a real Mongo global outside test-mode integration setup. Stub it so
// importing the module here never needs one — same pattern as
// src/models/UserKey.escrowPin.test.ts, but by relative path: `scripts/` sits
// outside this package's tsconfig `include`, so path-alias mocks (`@mongo`)
// resolved from here don't reliably match the alias-resolved import inside
// src/models/UserKey.ts, even though both point at the same file.
vi.mock('../src/mongo', () => ({ default: {} }));

import {
    buildCloudWatchMetricPayload,
    buildReport,
    activeModeFromEnv,
    CLOUDWATCH_NAMESPACE,
    type RawEscrowCounts,
} from './escrow-blob-mode-report';

const emptyRaw: RawEscrowCounts = {
    totalUserKeys: 0,
    enclaveModeCounts: [],
    enclaveKeyIdCounts: [],
    escrowPinEnabledCount: 0,
    optedOutCount: 0,
    pendingHoldsByPolicy: [],
};

describe('activeModeFromEnv', () => {
    it('maps remote to nitro', () => {
        expect(activeModeFromEnv('remote')).toBe('nitro');
    });

    it('maps software, undefined, and anything else to software', () => {
        expect(activeModeFromEnv('software')).toBe('software');
        expect(activeModeFromEnv(undefined)).toBe('software');
        expect(activeModeFromEnv('bogus')).toBe('software');
    });
});

describe('buildReport', () => {
    const now = new Date('2026-09-25T00:00:00.000Z');

    it('reports zero counts for known modes/policies with no data', () => {
        const report = buildReport(emptyRaw, 'nitro', now);

        expect(report.generatedAt).toBe(now.toISOString());
        expect(report.activeEnclaveMode).toBe('nitro');
        expect(report.byEnclaveMode).toEqual({ software: 0, nitro: 0 });
        expect(report.pendingHoldsByReleasePolicy).toEqual({ hold: 0, pin: 0 });
        expect(report.totals).toEqual({
            userKeys: 0,
            escrowBlobs: 0,
            escrowPinEnabled: 0,
            optedOut: 0,
            pendingHolds: 0,
        });
        expect(report.reseal).toEqual({ activeCount: 0, staleCount: 0, staleRatePercent: 0 });
    });

    it('computes the re-seal split for a normal software/nitro mix', () => {
        const raw: RawEscrowCounts = {
            ...emptyRaw,
            totalUserKeys: 20,
            enclaveModeCounts: [
                { mode: 'software', count: 7 },
                { mode: 'nitro', count: 3 },
            ],
            escrowPinEnabledCount: 2,
            optedOutCount: 1,
        };

        const report = buildReport(raw, 'nitro', now);

        expect(report.byEnclaveMode).toEqual({ software: 7, nitro: 3 });
        expect(report.totals.escrowBlobs).toBe(10);
        expect(report.reseal).toEqual({ activeCount: 3, staleCount: 7, staleRatePercent: 70 });
    });

    it('surfaces an unknown enclaveMode value instead of dropping it, and counts it as stale', () => {
        const raw: RawEscrowCounts = {
            ...emptyRaw,
            enclaveModeCounts: [
                { mode: 'software', count: 1 },
                { mode: 'nitro', count: 1 },
                { mode: 'legacy-v0', count: 2 },
            ],
        };

        const report = buildReport(raw, 'nitro', now);

        expect(report.byEnclaveMode).toEqual({ software: 1, nitro: 1, 'legacy-v0': 2 });
        expect(report.totals.escrowBlobs).toBe(4);
        // activeCount only counts the active mode bucket; the unknown mode is stale too.
        expect(report.reseal).toEqual({ activeCount: 1, staleCount: 3, staleRatePercent: 75 });
    });

    it('rounds the stale rate to 2 decimal places', () => {
        const raw: RawEscrowCounts = {
            ...emptyRaw,
            enclaveModeCounts: [
                { mode: 'software', count: 1 },
                { mode: 'nitro', count: 2 },
            ],
        };

        const report = buildReport(raw, 'nitro', now);

        // stale = 1, total = 3 -> 33.333...% rounds to 33.33
        expect(report.reseal.staleRatePercent).toBe(33.33);
    });

    it('passes through enclaveKeyId counts and an unknown release policy value', () => {
        const raw: RawEscrowCounts = {
            ...emptyRaw,
            enclaveKeyIdCounts: [
                { keyId: 'key-a', count: 4 },
                { keyId: 'key-b', count: 1 },
            ],
            pendingHoldsByPolicy: [
                { policy: 'hold', count: 3 },
                { policy: 'weird-future-policy', count: 1 },
            ],
        };

        const report = buildReport(raw, 'software', now);

        expect(report.byEnclaveKeyId).toEqual({ 'key-a': 4, 'key-b': 1 });
        expect(report.pendingHoldsByReleasePolicy).toEqual({
            hold: 3,
            pin: 0,
            'weird-future-policy': 1,
        });
        expect(report.totals.pendingHolds).toBe(4);
    });
});

describe('buildCloudWatchMetricPayload', () => {
    it('emits EscrowBlobs per mode dimension plus a single EscrowBlobsStale datum', () => {
        const report = buildReport(
            {
                ...emptyRaw,
                enclaveModeCounts: [
                    { mode: 'software', count: 5 },
                    { mode: 'nitro', count: 2 },
                ],
            },
            'nitro',
            new Date('2026-09-25T00:00:00.000Z')
        );

        const payload = buildCloudWatchMetricPayload(report);

        expect(payload.Namespace).toBe(CLOUDWATCH_NAMESPACE);
        expect(payload.MetricData).toHaveLength(3);
        expect(payload.MetricData).toEqual(
            expect.arrayContaining([
                {
                    MetricName: 'EscrowBlobs',
                    Value: 5,
                    Unit: 'Count',
                    Timestamp: report.generatedAt,
                    Dimensions: [{ Name: 'EnclaveMode', Value: 'software' }],
                },
                {
                    MetricName: 'EscrowBlobs',
                    Value: 2,
                    Unit: 'Count',
                    Timestamp: report.generatedAt,
                    Dimensions: [{ Name: 'EnclaveMode', Value: 'nitro' }],
                },
                {
                    MetricName: 'EscrowBlobsStale',
                    Value: 5,
                    Unit: 'Count',
                    Timestamp: report.generatedAt,
                },
            ])
        );
    });

    it('still emits a zero-value EscrowBlobsStale datum when there is no data at all', () => {
        const report = buildReport(emptyRaw, 'software', new Date('2026-09-25T00:00:00.000Z'));

        const payload = buildCloudWatchMetricPayload(report);

        const stale = payload.MetricData.find(datum => datum.MetricName === 'EscrowBlobsStale');
        expect(stale?.Value).toBe(0);
    });
});
