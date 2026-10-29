import { describe, expect, it, vi } from 'vitest';
import type { ClaimLinkRequestStatus } from '@learncard/types';
import { recoverClaim, type ClaimAttempt, type ClaimProgress } from './claimRecovery';

const newAttempt = (): ClaimAttempt => ({
    requestId: 'request-1',
    saved: false,
    running: false,
    complete: false,
});
const operations = () => ({
    check: vi.fn<() => Promise<ClaimLinkRequestStatus>>().mockResolvedValue({ status: 'absent' }),
    claim: vi.fn().mockResolvedValue('credential-1'),
    save: vi.fn().mockResolvedValue(undefined),
    refresh: vi.fn().mockResolvedValue(undefined),
});

describe('claim stage recovery', () => {
    it('keeps a failed status check distinct from terminal rejection and does not mutate', async () => {
        const attempt = newAttempt();
        const ops = operations();
        const progress = vi.fn();
        ops.check.mockRejectedValueOnce(new TypeError('offline'));
        expect(await recoverClaim(attempt, ops, progress)).toBe(false);
        expect(progress).toHaveBeenLastCalledWith({
            status: 'failed',
            stage: 'checking',
            saved: false,
        });
        expect(ops.claim).not.toHaveBeenCalled();
        expect(await recoverClaim(attempt, ops, progress)).toBe(true);
        expect(ops.claim).toHaveBeenCalledTimes(1);
    });

    it.each(['expired', 'exhausted', 'unavailable'] as const)(
        'preserves confirmed %s without issuing',
        async reason => {
            const ops = operations();
            ops.check.mockResolvedValue({ status: 'terminal', reason });
            const progress = vi.fn();
            expect(await recoverClaim(newAttempt(), ops, progress)).toBe(false);
            expect(progress).toHaveBeenLastCalledWith({ status: 'terminal', reason });
            expect(ops.claim).not.toHaveBeenCalled();
            expect(ops.save).not.toHaveBeenCalled();
        }
    );

    it('reconciles a committed claim with a lost response before saving the existing credential', async () => {
        const attempt = newAttempt();
        const ops = operations();
        ops.claim.mockRejectedValueOnce(new TypeError('response lost'));
        const progress = vi.fn();
        expect(await recoverClaim(attempt, ops, progress)).toBe(false);
        expect(progress).toHaveBeenLastCalledWith({
            status: 'failed',
            stage: 'claiming',
            saved: false,
        });
        ops.check.mockResolvedValue({ status: 'complete', credentialUri: 'committed-credential' });
        expect(await recoverClaim(attempt, ops, progress)).toBe(true);
        expect(ops.claim).toHaveBeenCalledTimes(1);
        expect(ops.save).toHaveBeenCalledExactlyOnceWith('committed-credential');
    });

    it('does not issue while an earlier request is still pending', async () => {
        const ops = operations();
        ops.check.mockResolvedValue({ status: 'pending' });
        const attempt = newAttempt();
        const progress = vi.fn();
        await recoverClaim(attempt, ops, progress);
        await recoverClaim(attempt, ops, progress);
        expect(progress).toHaveBeenLastCalledWith({ status: 'pending' });
        expect(ops.claim).not.toHaveBeenCalled();
    });

    it('retries a failed collection save without another claim', async () => {
        const ops = operations();
        ops.save.mockRejectedValueOnce(new Error('collection unavailable'));
        const attempt = newAttempt();
        const progress = vi.fn();
        await recoverClaim(attempt, ops, progress);
        expect(attempt.credentialUri).toBe('credential-1');
        expect(progress).toHaveBeenLastCalledWith({
            status: 'failed',
            stage: 'saving',
            saved: false,
        });
        expect(await recoverClaim(attempt, ops, progress)).toBe(true);
        expect(ops.check).toHaveBeenCalledTimes(1);
        expect(ops.claim).toHaveBeenCalledTimes(1);
        expect(ops.save).toHaveBeenCalledTimes(2);
    });

    it('retains saved success and retries only display refresh', async () => {
        const ops = operations();
        ops.refresh.mockRejectedValueOnce(new Error('display unavailable'));
        const attempt = newAttempt();
        const progress = vi.fn();
        await recoverClaim(attempt, ops, progress);
        expect(attempt.saved).toBe(true);
        expect(progress).toHaveBeenLastCalledWith({
            status: 'failed',
            stage: 'refreshing',
            saved: true,
        });
        expect(await recoverClaim(attempt, ops, progress)).toBe(true);
        expect(ops.claim).toHaveBeenCalledTimes(1);
        expect(ops.save).toHaveBeenCalledTimes(1);
        expect(ops.refresh).toHaveBeenCalledTimes(2);
    });

    it('serializes rapid recovery clicks and ignores a completed attempt', async () => {
        const ops = operations();
        let release!: (value: string) => void;
        ops.claim.mockImplementation(
            () =>
                new Promise<string>(resolve => {
                    release = resolve;
                })
        );
        const attempt = newAttempt();
        const stages: ClaimProgress[] = [];
        const first = recoverClaim(attempt, ops, progress => stages.push(progress));
        await vi.waitFor(() => expect(ops.claim).toHaveBeenCalledTimes(1));
        expect(await recoverClaim(attempt, ops, vi.fn())).toBe(false);
        release('credential-1');
        expect(await first).toBe(true);
        expect(await recoverClaim(attempt, ops, vi.fn())).toBe(true);
        expect(ops.save).toHaveBeenCalledTimes(1);
        expect(stages).toEqual([
            { status: 'working', stage: 'checking' },
            { status: 'working', stage: 'claiming' },
            { status: 'working', stage: 'saving' },
            { status: 'working', stage: 'refreshing' },
            { status: 'complete' },
        ]);
    });
});
