import { useMemo } from 'react';

import type { AuthProvider } from '../auth-coordinator/types';
import { getAuthConfig } from '../config/authConfig';
import { resolveAuthProvider } from '../config/providerRegistry';
import { authUserStore } from '../stores/authUserStore';
import { useSignInAdapter } from './SignInAdapterProvider';

/** Resolve coordinator auth from a live session, independently of persisted profile metadata. */
export const useAuthSessionProvider = (): AuthProvider | null => {
    // Subscribe to SDK publications, but never treat persisted metadata as a live session.
    authUserStore.use.currentUser();
    const adapter = useSignInAdapter();
    const providerType = getAuthConfig().authProvider;
    // null -> same UID is session restoration; same UID -> new name is enrichment.
    const userId = adapter.getCurrentUser()?.id;

    return useMemo(
        () => (userId ? resolveAuthProvider(getAuthConfig()) : null),
        [adapter, userId, providerType]
    );
};
