import { useEffect } from 'react';
import { getCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';

import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { Capacitor } from '@capacitor/core';
import { waitForSQLiteReady } from 'learn-card-base/SQL/sqliteReady';
export type { CurrentUser } from 'learn-card-base/stores/currentUserStore';

export const useCurrentUser = () => {
    const { getCurrentUser } = useSQLiteStorage();

    const currentUser = currentUserStore.useTracked.currentUser();
    const loadUser = async () => {
        // load user from sqlite
        const user = await getCurrentUser();

        if (user) {
            // If sqlite lacks pk, try centralized helper (handles platform specifics)
            if (!user.privateKey) {
                try {
                    const pk = await getCurrentUserPrivateKey();
                    if (pk) {
                        currentUserStore.set.currentUser({ ...user, privateKey: pk });
                        return;
                    }
                } catch {}
            }

            currentUserStore.set.currentUser(user);
        }
    };

    useEffect(() => {
        if (!currentUser) {
            loadUser();
        } else if (!currentUser?.privateKey) {
            // Try to hydrate from secure web storage before clearing
            (async () => {
                try {
                    if (Capacitor.isNativePlatform()) {
                        await waitForSQLiteReady();
                    }
                    const pk = await getCurrentUserPrivateKey();
                    if (pk) {
                        currentUserStore.set.currentUser({ ...currentUser, privateKey: pk });
                        return;
                    }
                } catch {}
                console.warn('⚠️ NO PRIVATE KEY, Logging Out CurrentUser', currentUser);
                currentUserStore.set.currentUser(null);
            })();
        }
    }, [currentUser]);

    return currentUser;
};

export default useCurrentUser;
