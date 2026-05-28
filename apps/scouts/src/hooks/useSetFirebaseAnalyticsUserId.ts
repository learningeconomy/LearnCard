import { useEffect } from 'react';

import { useWallet } from 'learn-card-base';

import useFirebaseAnalytics from './useFirebaseAnalytics';
import { useIsCurrentUserLCNUser, useCurrentUser } from 'learn-card-base';
import { getLogger } from 'learn-card-base';
const log = getLogger('use-set-firebase-analytics-user-id');

export type UseSetFirebaseAnalyticsUserIdOptions = { debug?: boolean };

export const useSetFirebaseAnalyticsUserId = (options: UseSetFirebaseAnalyticsUserIdOptions) => {
    const currentUser = useCurrentUser();
    const { data: currentLCNUser } = useIsCurrentUserLCNUser();

    const { getDID } = useWallet();

    const { setUserId } = useFirebaseAnalytics();

    const setFirebaseUserId = async () => {
        if (options.debug) log.debug('firebase analytics userId 🔥', currentUser);

        try {
            if (currentUser) {
                const did = await getDID();
                if (did) await setUserId(did);
            }
        } catch (error) {
            log.error('Unable to set firebase analytics userId', error);
        }
    };

    useEffect(() => {
        if (currentUser) {
            setFirebaseUserId();
        }
    }, [currentUser, currentLCNUser]);
};
