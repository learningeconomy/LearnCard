import { useEffect } from 'react';

import { useWallet } from 'learn-card-base';

import useFirebaseAnalytics from './useFirebaseAnalytics';
import { useIsCurrentUserLCNUser, useCurrentUser } from 'learn-card-base';

export type UseSetFirebaseAnalyticsUserIdOptions = { debug?: boolean };

export const useSetFirebaseAnalyticsUserId = (options: UseSetFirebaseAnalyticsUserIdOptions) => {
    const currentUser = useCurrentUser();
    const { data: currentLCNUser } = useIsCurrentUserLCNUser();

    const { getDID } = useWallet();

    const { setUserId } = useFirebaseAnalytics();

    const setFirebaseUserId = async () => {
        if (options.debug) console.debug('firebase analytics userId 🔥', currentUser);

        try {
            if (currentUser) {
                const did = await getDID();
                if (did) await setUserId(did);
            }
        } catch (error) {
            console.error('Unable to set firebase analytics userId', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            setFirebaseUserId();
        }
    }, [currentUser, currentLCNUser]);
};
