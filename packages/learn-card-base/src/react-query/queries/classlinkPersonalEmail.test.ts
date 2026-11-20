import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';

vi.mock('../../stores/walletStore', () => ({ walletStore: { use: { wallet: () => null } } }));

import {
    RECONCILE_RETRY_MS,
    loadAccountContinuity,
    resetAccountContinuityReconcile,
    withRecentSignInRetry,
} from './classlinkPersonalEmail';

const continuity = (
    overrides: Partial<ClassLinkAccountContinuity> = {}
): ClassLinkAccountContinuity =>
    ({
        personalEmail: { allowed: true },
        nextStep: 'email',
        primaryUid: 'uid-t',
        ...overrides,
    }) as ClassLinkAccountContinuity;

const makeInvoke = (answers: ClassLinkAccountContinuity[]) => {
    const queue = [...answers];
    return {
        classlinkGetAccountContinuity: vi.fn(async () => queue.shift() ?? answers.at(-1)!),
        classlinkReconcilePersonalEmail: vi.fn(
            async (): Promise<{ changed: boolean; customToken?: string }> => ({ changed: false })
        ),
    };
};

beforeEach(() => {
    resetAccountContinuityReconcile();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('loadAccountContinuity', () => {
    it('returns the answer without a reconcile when none is pending', async () => {
        const invoke = makeInvoke([continuity()]);
        const result = await loadAccountContinuity(invoke, 'did:a');
        expect(result.nextStep).toBe('email');
        expect(invoke.classlinkReconcilePersonalEmail).not.toHaveBeenCalled();
        expect(invoke.classlinkGetAccountContinuity).toHaveBeenCalledTimes(1);
    });

    it('reconciles, applies the custom token first, then reloads continuity', async () => {
        const order: string[] = [];
        const invoke = makeInvoke([
            continuity({ reconcilePending: true }),
            continuity({ nextStep: 'done' }),
        ]);
        invoke.classlinkReconcilePersonalEmail.mockImplementation(async () => {
            order.push('reconcile');
            return { changed: true, customToken: 'token' };
        });
        const apply = vi.fn(async () => {
            order.push('apply');
            return 'ok';
        });
        const onReconciled = vi.fn();
        invoke.classlinkGetAccountContinuity.mockImplementationOnce(async () => {
            order.push('get');
            return continuity({ reconcilePending: true });
        });
        invoke.classlinkGetAccountContinuity.mockImplementationOnce(async () => {
            order.push('get');
            return continuity({ nextStep: 'done' });
        });

        const result = await loadAccountContinuity(invoke, 'did:a', {
            applySignInToken: apply,
            onReconciled,
        });

        expect(result.nextStep).toBe('done');
        expect(order).toEqual(['get', 'reconcile', 'apply', 'get']);
        expect(apply).toHaveBeenCalledWith({ customToken: 'token', primaryUid: 'uid-t' });
        expect(onReconciled).toHaveBeenCalledTimes(1);
    });

    it('does not reload when nothing changed', async () => {
        const invoke = makeInvoke([continuity({ reconcilePending: true })]);
        const result = await loadAccountContinuity(invoke, 'did:a');
        expect(result.reconcilePending).toBe(true);
        expect(invoke.classlinkReconcilePersonalEmail).toHaveBeenCalledTimes(1);
        expect(invoke.classlinkGetAccountContinuity).toHaveBeenCalledTimes(1);
    });

    it('returns the first answer when the reconcile fails', async () => {
        const invoke = makeInvoke([continuity({ reconcilePending: true })]);
        invoke.classlinkReconcilePersonalEmail.mockRejectedValue(
            Object.assign(new Error('busy'), { data: { reason: 'busy' } })
        );
        const apply = vi.fn();
        const result = await loadAccountContinuity(invoke, 'did:a', { applySignInToken: apply });
        expect(result.reconcilePending).toBe(true);
        expect(apply).not.toHaveBeenCalled();
    });

    it('still reloads when applying the token fails (the coordinator keeps it)', async () => {
        const invoke = makeInvoke([
            continuity({ reconcilePending: true }),
            continuity({ nextStep: 'done' }),
        ]);
        invoke.classlinkReconcilePersonalEmail.mockResolvedValue({
            changed: true,
            customToken: 'token',
        });
        const apply = vi.fn().mockRejectedValue(new Error('offline'));
        const result = await loadAccountContinuity(invoke, 'did:a', { applySignInToken: apply });
        expect(result.nextStep).toBe('done');
    });

    it('never reconciles in a loop: once per account per retry window', async () => {
        vi.useFakeTimers();
        const invoke = makeInvoke([continuity({ reconcilePending: true })]);
        await loadAccountContinuity(invoke, 'did:a');
        await loadAccountContinuity(invoke, 'did:a');
        expect(invoke.classlinkReconcilePersonalEmail).toHaveBeenCalledTimes(1);

        // Another account has its own try.
        await loadAccountContinuity(invoke, 'did:b');
        expect(invoke.classlinkReconcilePersonalEmail).toHaveBeenCalledTimes(2);

        vi.advanceTimersByTime(RECONCILE_RETRY_MS + 1);
        await loadAccountContinuity(invoke, 'did:a');
        expect(invoke.classlinkReconcilePersonalEmail).toHaveBeenCalledTimes(3);
    });
});

describe('withRecentSignInRetry', () => {
    const refusal = () =>
        Object.assign(new Error('For your security, sign in again to change your email.'), {
            data: { code: 'FORBIDDEN', reason: 'recent_sign_in_required' },
        });
    const makeReport = (recorded: boolean) => ({
        classlinkRecordRecentSignIn: vi.fn(async () => ({ recorded })),
    });

    it('reports the sign-in and retries once when it now counts', async () => {
        const invoke = makeReport(true);
        const call = vi.fn().mockRejectedValueOnce(refusal()).mockResolvedValueOnce('ok');
        const getIdToken = vi.fn(async () => 'id-token');
        await expect(withRecentSignInRetry(invoke, getIdToken, call)).resolves.toBe('ok');
        expect(invoke.classlinkRecordRecentSignIn).toHaveBeenCalledWith({ idToken: 'id-token' });
        expect(call).toHaveBeenCalledTimes(2);
    });

    it('keeps the refusal when the sign-in does not count (email code, ClassLink, too old)', async () => {
        const invoke = makeReport(false);
        const error = refusal();
        const call = vi.fn().mockRejectedValue(error);
        await expect(withRecentSignInRetry(invoke, async () => 'id-token', call)).rejects.toBe(
            error
        );
        expect(call).toHaveBeenCalledTimes(1);
    });

    it('keeps the refusal when the report or the token fails', async () => {
        const invoke = { classlinkRecordRecentSignIn: vi.fn().mockRejectedValue(new Error('old')) };
        const error = refusal();
        const call = vi.fn().mockRejectedValue(error);
        await expect(withRecentSignInRetry(invoke, async () => 'id-token', call)).rejects.toBe(
            error
        );
        await expect(
            withRecentSignInRetry(
                makeReport(true),
                async () => {
                    throw new Error('no session');
                },
                call
            )
        ).rejects.toBe(error);
    });

    it('never reports for other errors or without a token source', async () => {
        const invoke = makeReport(true);
        const other = Object.assign(new Error('taken'), { data: { code: 'CONFLICT' } });
        await expect(
            withRecentSignInRetry(invoke, async () => 'id-token', vi.fn().mockRejectedValue(other))
        ).rejects.toBe(other);
        const error = refusal();
        await expect(
            withRecentSignInRetry(invoke, undefined, vi.fn().mockRejectedValue(error))
        ).rejects.toBe(error);
        expect(invoke.classlinkRecordRecentSignIn).not.toHaveBeenCalled();
    });
});
