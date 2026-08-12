import { describe, it, expect, vi } from 'vitest';

import { withDeadline, withDeadlineOr, DeadlineError, isDeadlineError } from './withDeadline';

const never = () => new Promise<never>(() => {});
const after = <T>(ms: number, value: T) =>
    new Promise<T>(resolve => setTimeout(() => resolve(value), ms));

describe('withDeadline', () => {
    it('resolves with the operation value when it beats the deadline', async () => {
        await expect(withDeadline(after(5, 'ok'), { ms: 100 })).resolves.toBe('ok');
    });

    it('rejects with DeadlineError when the operation exceeds the deadline', async () => {
        const err = await withDeadline(never(), { ms: 10, label: 'slow' }).catch(e => e);
        expect(isDeadlineError(err)).toBe(true);
        expect((err as DeadlineError).label).toBe('slow');
        expect((err as DeadlineError).ms).toBe(10);
    });

    it('propagates the operation error unchanged when it rejects before the deadline', async () => {
        const boom = new Error('boom');
        await expect(withDeadline(Promise.reject(boom), { ms: 100 })).rejects.toBe(boom);
    });

    it('fires onTimeout and aborts the passed signal on timeout', async () => {
        const onTimeout = vi.fn();
        let observed: AbortSignal | undefined;

        const err = await withDeadline(
            signal => {
                observed = signal;
                return never();
            },
            { ms: 10, onTimeout }
        ).catch(e => e);

        expect(isDeadlineError(err)).toBe(true);
        expect(onTimeout).toHaveBeenCalledOnce();
        expect(observed?.aborted).toBe(true);
    });
});

describe('withDeadlineOr', () => {
    it('returns the value on success', async () => {
        await expect(withDeadlineOr(after(5, 1), 0, { ms: 100 })).resolves.toBe(1);
    });

    it('returns the fallback on timeout', async () => {
        await expect(withDeadlineOr(never(), 'fallback', { ms: 10 })).resolves.toBe('fallback');
    });

    it('returns the fallback when the operation throws', async () => {
        await expect(
            withDeadlineOr(Promise.reject(new Error('x')), 'fallback', { ms: 100 })
        ).resolves.toBe('fallback');
    });
});
