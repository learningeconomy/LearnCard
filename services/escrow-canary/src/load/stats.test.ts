import { describe, expect, it } from 'vitest';
import { percentile, Recorder, summarizeLatency } from './stats';

describe('percentiles', () => {
    it('uses nearest rank', () => {
        const values = Array.from({ length: 100 }, (_, i) => i + 1);
        expect(percentile(values, 50)).toBe(50);
        expect(percentile(values, 95)).toBe(95);
        expect(percentile(values, 99)).toBe(99);
        expect(percentile(values, 100)).toBe(100);
        expect(percentile([7], 99)).toBe(7);
        expect(percentile([], 50)).toBe(0);
    });
    it('summarizes unsorted input without mutating it', () => {
        const values = [30, 10, 20];
        expect(summarizeLatency(values)).toEqual({ p50: 20, p95: 30, p99: 30, max: 30 });
        expect(values).toEqual([30, 10, 20]);
        expect(summarizeLatency([])).toBeNull();
    });
});

describe('Recorder', () => {
    const recorder = () =>
        new Recorder([
            { label: 'setup', targetRate: 1, durationSec: 10, scheduled: 10 },
            { label: 's1', targetRate: 2, durationSec: 4, scheduled: 8 },
        ]);

    it('summarizes per stage, scenario and step', () => {
        const r = recorder();
        for (let i = 0; i < 8; i += 1) r.started(1);
        r.late(1, 700);
        r.late(1, 900);
        r.dropped(1, 'in_flight');
        r.dropped(1, 'pin_pool_busy');
        r.scenario(1, 'enrol', 100);
        r.scenario(1, 'enrol', 300);
        r.scenario(1, 'enrol', 200, 'http_5xx');
        r.scenario(1, 'pinRecovery', 50, 'rate_limit');
        r.scenario(1, 'pinRecovery', 5, 'throttled_by_client_ip');
        r.step(1, 'login', 10);
        r.step(1, 'enroll', 90, 'http_5xx');
        const [setup, s1] = r.summary();
        expect(setup).toMatchObject({ stage: 'setup', started: 0, completed: 0 });
        expect(s1).toMatchObject({
            stage: 's1',
            targetRate: 2,
            scheduled: 8,
            started: 8,
            dropped: { in_flight: 1, pin_pool_busy: 1 },
            late: 2,
            maxLateMs: 900,
            achievedStartRate: 2,
            completed: 5,
            ok: 2,
            failed: 2,
            throttledByClientIp: 1,
            achievedOkRate: 0.5,
        });
        expect(s1.scenarios).toEqual({
            // Ok-only percentiles; the failure's latency is kept apart.
            enrol: {
                count: 3,
                ok: 2,
                errors: { http_5xx: 1 },
                latencyMs: { p50: 100, p95: 300, p99: 300, max: 300 },
                failedLatencyMs: { p50: 200, p95: 200, p99: 200, max: 200 },
            },
            pinRecovery: {
                count: 2,
                ok: 0,
                errors: { rate_limit: 1, throttled_by_client_ip: 1 },
                latencyMs: null,
                failedLatencyMs: { p50: 5, p95: 50, p99: 50, max: 50 },
            },
        });
        expect(s1.steps).toMatchObject({
            login: { count: 1, ok: 1, errors: {} },
            enroll: { count: 1, ok: 0, errors: { http_5xx: 1 } },
        });
    });

    it('reports an error rate only after enough completions', () => {
        const r = recorder();
        for (let i = 0; i < 19; i += 1) r.scenario(1, 'enrol', 1, 'x');
        expect(r.errorRate(1)).toBe(0);
        r.scenario(1, 'enrol', 1);
        expect(r.errorRate(1)).toBe(19 / 20);
    });

    it('does not count client-IP throttling as failure', () => {
        const r = recorder();
        for (let i = 0; i < 20; i += 1) r.scenario(1, 'pinRecovery', 1, 'throttled_by_client_ip');
        expect(r.errorRate(1)).toBe(0);
    });

    it('prints a fixed-format progress line', () => {
        const r = recorder();
        r.started(1);
        r.scenario(1, 'enrol', 120);
        expect(r.progressLine(1, 3, 12.4)).toBe(
            'progress stage=s1 t=12s started=1/8 in_flight=3 ok=1 failed=0 throttled_by_client_ip=0 ' +
                'dropped=0 late=0 ok_p50_ms=120 ok_p95_ms=120 ok_p99_ms=120 ok_max_ms=120 ' +
                'failed_p50_ms=- failed_p95_ms=-'
        );
        r.scenario(1, 'enrol', 5, 'http_5xx');
        r.scenario(1, 'pinRecovery', 2, 'throttled_by_client_ip');
        expect(r.progressLine(1, 0, 13)).toContain(
            'ok=1 failed=1 throttled_by_client_ip=1 dropped=0 late=0 ok_p50_ms=120 ok_p95_ms=120 ' +
                'ok_p99_ms=120 ok_max_ms=120 failed_p50_ms=2 failed_p95_ms=5'
        );
    });
});
