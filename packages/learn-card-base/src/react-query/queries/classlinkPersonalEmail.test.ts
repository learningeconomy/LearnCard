import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';

vi.mock('../../stores/walletStore', () => ({ walletStore: { use: { wallet: () => null } } }));

import {
    RECONCILE_RETRY_MS,
    loadAccountContinuity,
    resetAccountContinuityReconcile,
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
