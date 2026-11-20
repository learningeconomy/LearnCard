import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    loggedIn: true,
    hasProfile: false,
    isLoading: false,
    user: { uid: 'email-login-user', email: 'learner@example.com' },
    getIdToken: vi.fn(),
    verifyContact: vi.fn(),
    markVerifySuccess: vi.fn(),
}));
const authProvider = vi.hoisted(() => ({ getIdToken: mocks.getIdToken }));

vi.mock('learn-card-base', () => ({
    useIsLoggedIn: () => mocks.loggedIn,
    useIsCurrentUserLCNUser: () => ({ data: mocks.hasProfile, isLoading: mocks.isLoading }),
    currentUserStore: { get: { currentUser: () => mocks.user } },
    authUserStore: { useTracked: { currentUser: () => mocks.user } },
    getLogger: () => ({ error: vi.fn(), warn: vi.fn() }),
}));
vi.mock('learn-card-base/react-query/mutations/firebase', () => ({
    useVerifyContactMethodWithProofOfLogin: () => ({ mutateAsync: mocks.verifyContact }),
}));
vi.mock('../providers/AuthCoordinatorProvider', () => ({
    useAppAuth: () => ({ authProvider }),
}));
vi.mock('../stores/autoVerifyStore', () => ({
    default: { set: { markVerifySuccess: mocks.markVerifySuccess } },
}));

import { useAutoVerifyContactMethodWithProofOfLogin } from './useAutoVerifyContactMethodWithProofOfLogin';

beforeEach(() => {
    vi.clearAllMocks();
    mocks.loggedIn = true;
    mocks.hasProfile = false;
    mocks.isLoading = false;
    mocks.user = { uid: crypto.randomUUID(), email: 'learner@example.com' };
    mocks.getIdToken.mockResolvedValue('fresh-verified-id-token');
    mocks.verifyContact.mockResolvedValue({ success: true });
});

describe('automatic login contact verification', () => {
    it('verifies the login contact after signup creates a network profile', async () => {
        const { rerender } = renderHook(() => useAutoVerifyContactMethodWithProofOfLogin());
        expect(mocks.getIdToken).not.toHaveBeenCalled();

        mocks.hasProfile = true;
        rerender();

        await waitFor(() =>
            expect(mocks.verifyContact).toHaveBeenCalledWith({ token: 'fresh-verified-id-token' })
        );
        expect(mocks.getIdToken).toHaveBeenCalledWith(true);
        expect(mocks.markVerifySuccess).toHaveBeenCalledOnce();
    });

    it('also verifies on login for an existing network profile', async () => {
        mocks.hasProfile = true;
        renderHook(() => useAutoVerifyContactMethodWithProofOfLogin());

        await waitFor(() => expect(mocks.markVerifySuccess).toHaveBeenCalledOnce());
        expect(mocks.getIdToken).toHaveBeenCalledWith(true);
        expect(mocks.verifyContact).toHaveBeenCalledWith({ token: 'fresh-verified-id-token' });
    });

    it('does not report success if contact verification fails', async () => {
        mocks.hasProfile = true;
        mocks.verifyContact.mockResolvedValueOnce({ success: false });
        renderHook(() => useAutoVerifyContactMethodWithProofOfLogin());

        await waitFor(() => expect(mocks.verifyContact).toHaveBeenCalledOnce());
        expect(mocks.markVerifySuccess).not.toHaveBeenCalled();
    });
});
