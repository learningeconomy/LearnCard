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

describe('Keycloak callback boot', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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

    it('leaves Firebase redirects to the existing handler', () => {
        mocks.adapter.providerType = 'firebase';
        window.history.replaceState({}, '', '/login?code=code&state=state');
        renderHook(() => useKeycloakRedirect());
        expect(mocks.adapter.checkRedirectResult).not.toHaveBeenCalled();
    });

    it('does not process ordinary login visits', () => {
        renderHook(() => useKeycloakRedirect());
        expect(mocks.adapter.checkRedirectResult).not.toHaveBeenCalled();
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
