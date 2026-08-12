import { describe, it, expect } from 'vitest';
import { PerfTracker } from './perf';

describe('PerfTracker.capture', () => {
    it('returns total_ms and per-phase timings even when LC_PERF_LOG is unset', () => {
        delete process.env.LC_PERF_LOG;
        const t = new PerfTracker('test');
        t.mark('phase1');
        t.mark('phase2');
        const result = t.capture();
        expect(result.total_ms).toBeGreaterThanOrEqual(0);
        expect(result.phases).toHaveProperty('phase1');
        expect(result.phases).toHaveProperty('phase2');
    });
});
