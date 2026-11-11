import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    adapter: { providerType: 'keycloak', checkRedirectResult: vi.fn() },
    toast: vi.fn(),
    warn: vi.fn(),
}));
vi.mock('learn-card-base', () => ({
    useSignInAdapter: () => mocks.adapter,
    useToast: () => ({ presentToast: mocks.toast }),
    ToastTypeEnum: { Error: 'error' },
    getLogger: () => ({ warn: mocks.warn }),
}));
import { AuthSessionError } from '@learncard/types';
import { useKeycloakRedirect } from './useKeycloakRedirect';
import { beginKeycloakReauth, readKeycloakReauth } from './keycloakReauth';

describe('Keycloak callback boot', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        mocks.adapter.providerType = 'keycloak';
        mocks.adapter.checkRedirectResult.mockResolvedValue(null);
        window.history.replaceState({}, '', '/login');
    });

    it('completes a callback once even on rerender', () => {
        window.history.replaceState({}, '', '/login?code=code&state=state');
        const { rerender } = renderHook(() => useKeycloakRedirect());
        rerender();
        expect(mocks.adapter.checkRedirectResult).toHaveBeenCalledTimes(1);
    });

    it('waits for the existing account to be ready and resumes exactly once', async () => {
        window.history.replaceState({}, '', '/wallet');
        const intent = beginKeycloakReauth('same-user', 'account-recovery');
        window.history.replaceState({}, '', '/login?code=code&state=state');
        mocks.adapter.checkRedirectResult.mockResolvedValue({ id: 'same-user' });
        const resume = vi.fn().mockResolvedValue(undefined);
        const { rerender } = renderHook(({ ready }) => useKeycloakRedirect(resume, ready), {
            initialProps: { ready: false },
        });
        await waitFor(() => expect(mocks.adapter.checkRedirectResult).toHaveBeenCalledTimes(1));
        expect(resume).not.toHaveBeenCalled();
        rerender({ ready: true });
        await waitFor(() => expect(resume).toHaveBeenCalledWith(intent));
        rerender({ ready: true });
        expect(resume).toHaveBeenCalledTimes(1);
        expect(readKeycloakReauth()).toBeNull();
    });

    it('leaves Firebase redirects to the existing handler', () => {
        mocks.adapter.providerType = 'firebase';
        window.history.replaceState({}, '', '/login?code=code&state=state');
        renderHook(() => useKeycloakRedirect());
        expect(mocks.adapter.checkRedirectResult).not.toHaveBeenCalled();
    });

    it('does not resume when the intent expires while waiting for account readiness', async () => {
        const intent = beginKeycloakReauth('same-user', 'recovery-setup');
        window.history.replaceState({}, '', '/login?code=code&state=state');
        mocks.adapter.checkRedirectResult.mockResolvedValue({ id: 'same-user' });
        const resume = vi.fn().mockResolvedValue(undefined);
        const { rerender } = renderHook(({ ready }) => useKeycloakRedirect(resume, ready), {
            initialProps: { ready: false },
        });
        await waitFor(() => expect(mocks.adapter.checkRedirectResult).toHaveBeenCalledTimes(1));
        sessionStorage.setItem(
            'learncard:keycloak:reauth',
            JSON.stringify({ ...intent, createdAt: Date.now() - 600001 })
        );
        rerender({ ready: true });
        await waitFor(() => expect(mocks.toast).toHaveBeenCalled());
        expect(resume).not.toHaveBeenCalled();
        expect(readKeycloakReauth()).toBeNull();
    });

    it('does not process ordinary login visits', () => {
        renderHook(() => useKeycloakRedirect());
        expect(mocks.adapter.checkRedirectResult).not.toHaveBeenCalled();
    });

    it('does not mistake a state-only post-logout return for sign-in', () => {
        window.history.replaceState({}, '', '/login?state=logout-state');
        renderHook(() => useKeycloakRedirect());
        expect(mocks.adapter.checkRedirectResult).not.toHaveBeenCalled();
        expect(mocks.toast).not.toHaveBeenCalled();
    });

    it('shows friendly expired-sign-in feedback without exposing callback details', async () => {
        window.history.replaceState({}, '', '/login?error=login_required&state=state');
        mocks.adapter.checkRedirectResult.mockRejectedValue(
            new AuthSessionError('sensitive details', 'expired')
        );
        renderHook(() => useKeycloakRedirect());
        await waitFor(() =>
            expect(mocks.toast).toHaveBeenCalledWith('Sign-in expired. Please try again.', {
                type: 'error',
                hasDismissButton: true,
            })
        );
    });
});
