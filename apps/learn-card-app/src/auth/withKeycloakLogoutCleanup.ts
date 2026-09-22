import type { AuthProvider, KeycloakAuthProvider } from 'learn-card-base';

/** Redirect-based logout must finish app cleanup before the current page is unloaded. */
export const withKeycloakLogoutCleanup = (
    provider: AuthProvider | null,
    cleanup: () => Promise<void>
): AuthProvider | null => {
    if (provider?.getProviderType() !== 'keycloak') return provider;

    const keycloak = provider as KeycloakAuthProvider;
    return { ...provider, signOut: () => keycloak.signOut(cleanup) };
};
