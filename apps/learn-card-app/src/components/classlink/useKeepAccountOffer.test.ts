// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';

const mocks = vi.hoisted(() => ({
    features: {} as Record<string, boolean>,
    status: 'ready',
    uid: 'uid-t',
    escrowEnrollment: 'enrolled' as string | undefined,
    escrowMode: 'nitro',
    classlink: true,
    continuity: undefined as unknown,
    isLoading: false,
    continuityHook: vi.fn(),
    getSession: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useFeatureConfig: () => mocks.features,
    getSSSConfig: () => ({ escrowEnclaveMode: mocks.escrowMode }),
    useClassLinkAccountContinuity: (options: { enabled: boolean }) => {
        mocks.continuityHook(options);
        return options.enabled
            ? { data: mocks.continuity, isLoading: mocks.isLoading }
            : { data: undefined, isLoading: false };
    },
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({
        state: {
            status: mocks.status,
            authUser: { id: mocks.uid },
            escrowEnrollment: mocks.escrowEnrollment,
        },
    }),
}));
vi.mock('../../auth/classlink/classlinkProfileDefaults', () => ({
    getClassLinkSession: mocks.getSession,
}));

import { isKeepAccountEnabled } from './keepAccountFlags';
import {
    needsKeepAccount,
    resolveKeepAccountStep,
    useKeepAccountOffer,
} from './useKeepAccountOffer';

const ALL_ON = { classlinkSso: true, classlinkPersonalEmail: true, classlinkKeepAccount: true };

const continuity = (
    nextStep: ClassLinkAccountContinuity['nextStep'],
    allowed = true
): ClassLinkAccountContinuity => ({
    personalEmail: allowed ? { allowed } : { allowed, reason: 'district_off' },
    emailVerified: nextStep !== 'email',
    emailPrimary: nextStep !== 'email',
    primaryUid: 'uid-t',
    signInEmailSource: nextStep !== 'email' ? 'personal' : undefined,
    hasSchoolEmail: true,
    contactStale: nextStep === 'confirmPin',
    canRemove: true,
    hasServerConfirmedMethod: nextStep === 'done' || nextStep === 'pin',
    hasUserRecoveryMethod: false,
    pinState: nextStep === 'done' ? 'enabled' : 'none',
    pinRecoverable: nextStep === 'done',
    nextStep,
});

/** Renders the hook and lets the async ClassLink session check settle. */
const renderOffer = async (enabled?: boolean) => {
    const view = renderHook(() => useKeepAccountOffer(enabled));
    await act(async () => {
        await Promise.resolve();
    });
    return view;
};

/** Whether any render asked lca-api for the account continuity. */
const queried = (): boolean =>
    mocks.continuityHook.mock.calls.some(([options]) => options.enabled === true);

beforeEach(() => {
    vi.clearAllMocks();
    mocks.features = { ...ALL_ON };
    mocks.status = 'ready';
    mocks.uid = 'uid-t';
    mocks.escrowEnrollment = 'enrolled';
    mocks.escrowMode = 'nitro';
    mocks.classlink = true;
    mocks.continuity = continuity('email');
    mocks.isLoading = false;
    mocks.getSession.mockImplementation(async () => ({
        classlink: mocks.classlink,
        student: false,
    }));
});

describe('isKeepAccountEnabled', () => {
    it('needs all three tenant flags', () => {
        expect(isKeepAccountEnabled(ALL_ON)).toBe(true);
        for (const flag of Object.keys(ALL_ON)) {
            expect(isKeepAccountEnabled({ ...ALL_ON, [flag]: false })).toBe(false);
        }
        expect(isKeepAccountEnabled({})).toBe(false);
    });
});

describe('needsKeepAccount', () => {
    it('offers the email step only when the server allows it', () => {
        expect(needsKeepAccount(continuity('email'))).toBe(true);
        expect(needsKeepAccount(continuity('email', false))).toBe(false);
    });

    it('offers the PIN step whatever the email policy says', () => {
        expect(needsKeepAccount(continuity('pin'))).toBe(true);
        expect(needsKeepAccount(continuity('pin', false))).toBe(true);
    });

    it('offers the passkey / phrase step an account without escrow still needs', () => {
        // The server only answers `method` once the email is in and there is no escrow.
        expect(needsKeepAccount(continuity('method'))).toBe(true);
    });

    it('offers the PIN confirm only on the login that holds the sign-in email', () => {
        expect(needsKeepAccount(continuity('confirmPin'), { sessionUid: 'uid-t' })).toBe(true);
        expect(needsKeepAccount(continuity('confirmPin'), { sessionUid: 'uid-other' })).toBe(false);
        expect(needsKeepAccount(continuity('confirmPin'))).toBe(false);
        expect(resolveKeepAccountStep(continuity('confirmPin'), { sessionUid: 'uid-other' })).toBe(
            'otherUid'
        );
    });

    it('asks to type the sign-in email when a no-PIN backup is stale and this device never confirmed it', () => {
        const stale = { ...continuity('done'), pinState: 'none' as const, contactStale: true };
        expect(
            resolveKeepAccountStep(stale, { sessionUid: 'uid-t', contactConfirmed: false })
        ).toBe('confirmEmail');
        expect(needsKeepAccount(stale, { sessionUid: 'uid-t', contactConfirmed: false })).toBe(
            true
        );
        // Confirmed here: the step re-seals silently. Another login, or unknown: done.
        expect(resolveKeepAccountStep(stale, { sessionUid: 'uid-t', contactConfirmed: true })).toBe(
            'done'
        );
        expect(
            resolveKeepAccountStep(stale, { sessionUid: 'uid-other', contactConfirmed: false })
        ).toBe('done');
        expect(resolveKeepAccountStep(stale, { sessionUid: 'uid-t' })).toBe('done');
        // After a removal lca-api answers `email`: the old address is cut off first.
        expect(
            resolveKeepAccountStep(
                { ...stale, emailPrimary: false, nextStep: 'email' },
                { sessionUid: 'uid-t', contactConfirmed: false }
            )
        ).toBe('confirmEmail');
    });

    it('asks for a passkey or phrase instead of a PIN where escrow cannot enroll', () => {
        for (const escrowEnrollment of ['not-enrolled', 'opted-out', 'disabled']) {
            expect(resolveKeepAccountStep(continuity('pin'), { escrowEnrollment })).toBe('method');
        }
        expect(resolveKeepAccountStep(continuity('pin'), { escrowOff: true })).toBe('method');
        // Unknown yet, or enrolled: the PIN.
        expect(resolveKeepAccountStep(continuity('pin'), {})).toBe('pin');
        expect(resolveKeepAccountStep(continuity('pin'), { escrowEnrollment: 'enrolled' })).toBe(
            'pin'
        );
    });

    it('offers nothing once done or without an answer', () => {
        expect(needsKeepAccount(continuity('done'))).toBe(false);
        expect(needsKeepAccount(undefined)).toBe(false);
    });
});

describe('useKeepAccountOffer', () => {
    it('offers the step for a ready ClassLink session the server says needs it', async () => {
        const { result } = await renderOffer();
        expect(result.current).toEqual({
            offer: true,
            pending: false,
            continuity: continuity('email'),
            step: 'email',
        });
    });

    it.each(Object.keys(ALL_ON))('makes no lca-api call with %s off', async flag => {
        mocks.features = { ...ALL_ON, [flag]: false };
        const { result } = await renderOffer();

        expect(result.current).toEqual({
            offer: false,
            pending: false,
            continuity: undefined,
            step: undefined,
        });
        expect(queried()).toBe(false);
        expect(mocks.getSession).not.toHaveBeenCalled();
    });

    it('waits for a ready account', async () => {
        mocks.status = 'loading';
        const { result } = await renderOffer();
        expect(result.current.offer).toBe(false);
        expect(result.current.pending).toBe(false);
        expect(queried()).toBe(false);
    });

    it('never asks the server for a non-ClassLink session', async () => {
        mocks.classlink = false;
        const { result } = await renderOffer();
        expect(result.current).toEqual({
            offer: false,
            pending: false,
            continuity: undefined,
            step: undefined,
        });
        expect(queried()).toBe(false);
    });

    it('stays off when the host disables it', async () => {
        const { result } = await renderOffer(false);
        expect(result.current.offer).toBe(false);
        expect(queried()).toBe(false);
    });

    it('hides the PIN confirm on another login of the account', async () => {
        mocks.continuity = continuity('confirmPin');
        mocks.uid = 'uid-other';
        const { result } = await renderOffer();
        expect(result.current).toMatchObject({ offer: false, step: 'otherUid' });
    });

    it('is pending until the session and the server answer are known', async () => {
        mocks.getSession.mockReturnValue(new Promise(() => undefined));
        const { result: checking } = await renderOffer();
        expect(checking.current).toMatchObject({ offer: false, pending: true });

        mocks.getSession.mockResolvedValue({ classlink: true, student: false });
        mocks.isLoading = true;
        mocks.continuity = undefined;
        const { result: loading } = await renderOffer();
        expect(loading.current).toMatchObject({ offer: false, pending: true });
    });
});
