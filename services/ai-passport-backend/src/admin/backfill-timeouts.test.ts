import { expect, spyOn, test } from 'bun:test';
import {
    LEGACY_UNIT_TIMEOUT_MS,
    MANAGED_UNIT_TIMEOUT_MS,
    MANAGED_GENERATION_TIMEOUT_MS,
    MANAGED_FINALIZATION_RESERVE_MS,
    MANAGED_LEASE_MARGIN_MS,
    managedGenerationOptions,
} from './backfill-timeouts';
test('managed deadlines fit existing leases and reserve finalization time', () => {
    expect(LEGACY_UNIT_TIMEOUT_MS).toBe(120000);
    expect(MANAGED_UNIT_TIMEOUT_MS).toBe(360000);
    expect(MANAGED_GENERATION_TIMEOUT_MS).toBe(240000);
    expect(MANAGED_UNIT_TIMEOUT_MS + MANAGED_LEASE_MARGIN_MS).toBeLessThan(600000);
    expect(MANAGED_UNIT_TIMEOUT_MS + MANAGED_LEASE_MARGIN_MS).toBeLessThan(660000);
    expect(MANAGED_FINALIZATION_RESERVE_MS).toBe(60000);
});
test('generation pipeline uses only remaining unit time before finalization; owner cancellation wins', () => {
    const timers: number[] = [];
    const clock = spyOn(AbortSignal, 'timeout').mockImplementation(ms => {
        timers.push(ms);
        return new AbortController().signal;
    });
    try {
        const owner = new AbortController();
        const first = managedGenerationOptions(owner.signal, 360000, 0);
        expect(first.timeoutMs).toBe(240000);
        expect(timers).toEqual([300000]);
        managedGenerationOptions(owner.signal, 360000, 210000);
        expect(timers[1]).toBe(90000);
        owner.abort();
        expect(first.signal.aborted).toBe(true);
        expect(() => managedGenerationOptions(owner.signal, 360000, 300000)).toThrow(
            'deadline elapsed'
        );
        expect(timers).toHaveLength(2);
    } finally {
        clock.mockRestore();
    }
});
test('generation stage expiry aborts even when the whole-unit signal remains live', () => {
    const stage = new AbortController(),
        unit = new AbortController();
    const clock = spyOn(AbortSignal, 'timeout').mockReturnValue(stage.signal);
    try {
        const options = managedGenerationOptions(unit.signal, Date.now() + 360000);
        stage.abort(new DOMException('synthetic deadline', 'TimeoutError'));
        expect(options.signal.aborted).toBe(true);
        expect(unit.signal.aborted).toBe(false);
    } finally {
        clock.mockRestore();
    }
});
