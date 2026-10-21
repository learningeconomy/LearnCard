import { describe, expect, it, vi } from 'vitest';
import type { AuthProvider } from 'learn-card-base';
import { withKeycloakLogoutCleanup } from './withKeycloakLogoutCleanup';

const createProvider = (type: string): AuthProvider => ({
    getProviderType: () => type,
    getCurrentUser: vi.fn().mockResolvedValue(null),
    getIdToken: vi.fn().mockResolvedValue('id'),
    signOut: vi.fn(async (beforeRedirect?: () => Promise<void>) => {
        await beforeRedirect?.();
    }),
});

describe('Keycloak logout cleanup integration', () => {
    it('passes awaited host cleanup to Keycloak before redirecting', async () => {
        const provider = createProvider('keycloak');
        const cleanup = vi.fn().mockResolvedValue(undefined);
        await withKeycloakLogoutCleanup(provider, cleanup)?.signOut();
        expect(provider.signOut).toHaveBeenCalledExactlyOnceWith(cleanup);
        expect(cleanup).toHaveBeenCalledOnce();
    });

    it('leaves Firebase sequencing unchanged', async () => {
        const provider = createProvider('firebase');
        const cleanup = vi.fn();
        expect(withKeycloakLogoutCleanup(provider, cleanup)).toBe(provider);
        await provider.signOut();
        expect(cleanup).not.toHaveBeenCalled();
    });

    it('preserves the no-provider path', () => {
        expect(withKeycloakLogoutCleanup(null, vi.fn())).toBeNull();
    });
});
