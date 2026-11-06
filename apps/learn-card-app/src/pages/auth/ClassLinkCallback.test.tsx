// @vitest-environment jsdom
import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    search: '',
    intent: 'signIn' as 'signIn' | 'connect',
    replace: vi.fn(),
    presentToast: vi.fn(),
    exchangeCode: vi.fn(),
    connect: vi.fn(),
    signIn: vi.fn(),
    logout: vi.fn(),
    consume: vi.fn(),
    applyPrivate: vi.fn(async () => true),
    wallet: { invoke: {} },
}));

vi.mock('react-router-dom', () => ({ useHistory: () => ({ replace: mocks.replace }) }));
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: vi.fn(async () => undefined) }),
}));
vi.mock('learn-card-base', () => ({
    usePathQuery: () => new URLSearchParams(mocks.search),
    useToast: () => ({ presentToast: mocks.presentToast }),
    ToastTypeEnum: { Error: 'error', Success: 'success' },
    authUserStore: { get: { currentUser: () => null } },
    SocialLoginTypes: { classlink: 'classlink' },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
    useWallet: () => ({ initWallet: async () => mocks.wallet }),
    SCHOOL_CONNECTION_QUERY_KEY: 'schoolConnection',
}));
vi.mock('learn-card-base/react-query/mutations/firebase', () => ({
    useClassLinkExchangeCode: () => ({ mutateAsync: mocks.exchangeCode }),
    useClassLinkConnect: () => ({ mutateAsync: mocks.connect }),
}));
vi.mock('../loadingPage/LoadingPage', () => ({ LoadingPageDumb: () => null }));
vi.mock('../../hooks/useFirebase', () => ({
    useFirebase: () => ({ signInWithCustomFirebaseToken: mocks.signIn }),
}));
vi.mock('../../providers/AuthCoordinatorProvider', () => ({
    useAuthCoordinator: () => ({ logout: mocks.logout }),
    useAppAuth: () => ({ state: { status: 'ready' } }),
}));
vi.mock('../../auth/classlink/classlinkPkce', () => ({
    consumeClassLinkAttempt: mocks.consume,
    peekClassLinkAttemptIntent: () => mocks.intent,
}));
vi.mock('../../auth/classlink/classlinkProfileDefaults', () => ({
    applyClassLinkPrivateProfile: mocks.applyPrivate,
}));
vi.mock('../../auth/classlink/startClassLinkLogin', () => ({
    CLASSLINK_TIMEOUT_ERROR: 'login_timeout',
}));

import ClassLinkCallback from './ClassLinkCallback';
import { resetClassLinkCallbackClaims } from '../../auth/classlink/classlinkCallbackGuard';
import * as m from '../../paraglide/messages.js';

const ATTEMPT = {
    state: 'state-1',
    nonce: 'nonce-1',
    codeVerifier: 'v'.repeat(64),
    redirectUri: 'https://app.example/auth/classlink/callback',
    createdAt: Date.now(),
};

describe('ClassLinkCallback (sign-in)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetClassLinkCallbackClaims();
        mocks.intent = 'signIn';
        mocks.search = '?code=code-1&state=state-1';
        // Real single-use behaviour: the second consume finds nothing.
        let stored: typeof ATTEMPT | null = ATTEMPT;
        mocks.consume.mockImplementation(async () => {
            const attempt = stored;
            stored = null;
            return attempt;
        });
        mocks.exchangeCode.mockResolvedValue({ token: 'custom-token' });
        mocks.signIn.mockResolvedValue(undefined);
    });
    afterEach(cleanup);

    it('signs in once and records the ClassLink login method', async () => {
        render(<ClassLinkCallback />);
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/wallet'));
        expect(mocks.signIn).toHaveBeenCalledWith('custom-token', {
            loginMethod: 'classlink',
            throwOnError: true,
        });
    });

    it('exchanges the code only once when the callback renders twice', async () => {
        render(
            <>
                <ClassLinkCallback />
                <ClassLinkCallback />
            </>
        );
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/wallet'));
        expect(mocks.exchangeCode).toHaveBeenCalledTimes(1);
        expect(mocks.replace).toHaveBeenCalledTimes(1);
        expect(mocks.presentToast).not.toHaveBeenCalled();
    });

    it('shows the error and returns to /login when the Firebase sign-in fails', async () => {
        mocks.signIn.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/network' }));
        render(<ClassLinkCallback />);
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
        expect(mocks.replace).not.toHaveBeenCalledWith('/wallet');
        expect(mocks.presentToast).toHaveBeenCalledWith(
            m['login.classlink.failed'](),
            expect.objectContaining({ type: 'error' })
        );
    });

    it('reports a timed-out native sheet as too slow, not cancelled', async () => {
        mocks.search = '?error=login_timeout&state=state-1';
        render(<ClassLinkCallback />);
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
        expect(mocks.presentToast).toHaveBeenCalledWith(
            m['login.classlink.timedOut'](),
            expect.anything()
        );
        expect(mocks.consume).toHaveBeenCalledWith('state-1');
        expect(mocks.exchangeCode).not.toHaveBeenCalled();
    });

    it('shows a translated outage message when ClassLink is unavailable', async () => {
        mocks.exchangeCode.mockRejectedValue(
            Object.assign(new Error('School sign-in is temporarily unavailable.'), {
                data: { code: 'SERVICE_UNAVAILABLE' },
            })
        );
        render(<ClassLinkCallback />);
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
        expect(mocks.presentToast).toHaveBeenCalledWith(
            m['login.classlink.unavailable'](),
            expect.objectContaining({ type: 'error' })
        );
    });

    it('shows the server conflict message for a CONFLICT', async () => {
        const message = 'You already have a LearnCard account with this email.';
        mocks.exchangeCode.mockRejectedValue(
            Object.assign(new Error(message), { data: { code: 'CONFLICT' } })
        );
        render(<ClassLinkCallback />);
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/login'));
        expect(mocks.presentToast).toHaveBeenCalledWith(message, expect.anything());
    });

    it('reports a closed sheet as cancelled', async () => {
        mocks.search = '?error=access_denied';
        render(<ClassLinkCallback />);
        await waitFor(() =>
            expect(mocks.presentToast).toHaveBeenCalledWith(
                m['login.classlink.cancelled'](),
                expect.anything()
            )
        );
    });
});

describe('ClassLinkCallback (School Connect)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetClassLinkCallbackClaims();
        mocks.intent = 'connect';
        mocks.search = '?code=code-2&state=state-1';
        let stored: (typeof ATTEMPT & { redirectTo?: string }) | null = {
            ...ATTEMPT,
            redirectTo: '/school-connect',
        };
        mocks.consume.mockImplementation(async () => {
            const attempt = stored;
            stored = null;
            return attempt;
        });
    });
    afterEach(cleanup);

    it('connects once and makes a student profile private', async () => {
        mocks.connect.mockResolvedValue({ isStudent: true, schoolName: 'Test High' });
        render(
            <>
                <ClassLinkCallback />
                <ClassLinkCallback />
            </>
        );
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/school-connect'));
        expect(mocks.connect).toHaveBeenCalledTimes(1);
        expect(mocks.applyPrivate).toHaveBeenCalledWith(mocks.wallet);
        expect(mocks.presentToast).toHaveBeenCalledTimes(1);
    });

    it('shows a translated outage message when ClassLink is unavailable', async () => {
        mocks.connect.mockRejectedValue(
            Object.assign(new Error('unavailable'), { data: { code: 'SERVICE_UNAVAILABLE' } })
        );
        render(<ClassLinkCallback />);
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/school-connect'));
        expect(mocks.presentToast).toHaveBeenCalledWith(
            m['login.classlink.unavailable'](),
            expect.objectContaining({ type: 'error' })
        );
    });

    it('leaves a non-student profile unchanged', async () => {
        mocks.connect.mockResolvedValue({ isStudent: false });
        render(<ClassLinkCallback />);
        await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/school-connect'));
        expect(mocks.applyPrivate).not.toHaveBeenCalled();
    });
});
