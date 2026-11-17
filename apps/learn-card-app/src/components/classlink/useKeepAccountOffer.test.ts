// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClassLinkAccountContinuity } from '@learncard/lca-api-plugin';

const mocks = vi.hoisted(() => ({
    features: {} as Record<string, boolean>,
    status: 'ready',
    classlink: true,
    continuity: undefined as unknown,
    isLoading: false,
    continuityHook: vi.fn(),
    getSession: vi.fn(),
}));

vi.mock('learn-card-base', () => ({
    useFeatureConfig: () => mocks.features,
    useClassLinkAccountContinuity: (options: { enabled: boolean }) => {
        mocks.continuityHook(options);
        return options.enabled
            ? { data: mocks.continuity, isLoading: mocks.isLoading }
            : { data: undefined, isLoading: false };
    },
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({ state: { status: mocks.status } }),
}));
vi.mock('../../auth/classlink/classlinkProfileDefaults', () => ({
    getClassLinkSession: mocks.getSession,
}));

import { isKeepAccountEnabled, needsKeepAccount, useKeepAccountOffer } from './useKeepAccountOffer';

const ALL_ON = { classlinkSso: true, classlinkPersonalEmail: true, classlinkKeepAccount: true };

const continuity = (
    nextStep: ClassLinkAccountContinuity['nextStep'],
    allowed = true
): ClassLinkAccountContinuity => ({
    personalEmail: allowed ? { allowed } : { allowed, reason: 'district_off' },
    emailVerified: nextStep !== 'email',
    recoveryEmailVerified: nextStep !== 'email',
    hasServerConfirmedMethod: nextStep === 'done',
    hasUserRecoveryMethod: nextStep === 'done',
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

    it('offers the method step whatever the email policy says', () => {
        expect(needsKeepAccount(continuity('method'))).toBe(true);
        expect(needsKeepAccount(continuity('method', false))).toBe(true);
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
        });
    });

    it.each(Object.keys(ALL_ON))('makes no lca-api call with %s off', async flag => {
        mocks.features = { ...ALL_ON, [flag]: false };
        const { result } = await renderOffer();

        expect(result.current).toEqual({ offer: false, pending: false, continuity: undefined });
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
        expect(result.current).toEqual({ offer: false, pending: false, continuity: undefined });
        expect(queried()).toBe(false);
    });

    it('stays off when the host disables it', async () => {
        const { result } = await renderOffer(false);
        expect(result.current.offer).toBe(false);
        expect(queried()).toBe(false);
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
