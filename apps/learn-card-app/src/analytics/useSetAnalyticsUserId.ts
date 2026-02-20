import { useEffect } from 'react';

import { useWallet } from 'learn-card-base';
import { useIsCurrentUserLCNUser, useCurrentUser } from 'learn-card-base';

import { useAnalytics } from './context';

export interface UseSetAnalyticsUserIdOptions {
    debug?: boolean;
}

/**
 * Hook to automatically identify the current user in analytics when they log in.
 * Replaces useSetFirebaseAnalyticsUserId with a provider-agnostic implementation.
 */
export function useSetAnalyticsUserId(options: UseSetAnalyticsUserIdOptions = {}) {
    const currentUser = useCurrentUser();
    const { data: currentLCNUser } = useIsCurrentUserLCNUser();
    const { getDID } = useWallet();
    const { identify } = useAnalytics();

    useEffect(() => {
        const setUserId = async () => {
            if (options.debug) {
                console.debug('[Analytics] Setting userId', currentUser);
            }

            try {
                if (currentUser) {
                    const did = await getDID();

                    if (did) {
                        await identify(did);
                    }
                }
            } catch (error) {
                console.error('[Analytics] Unable to set userId', error);
            }
        };

        if (currentUser) {
            setUserId();
        }
    }, [currentUser, currentLCNUser, getDID, identify, options.debug]);
}

export default useSetAnalyticsUserId;
